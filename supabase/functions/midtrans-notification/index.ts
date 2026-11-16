import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper menghitung hash SHA-512 menggunakan Web Crypto API standar
async function calculateSha512(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-512", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Midtrans hanya mengirim HTTP POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed. Only POST is accepted." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "";

    if (!midtransServerKey) {
      console.error("[midtrans-notification] MIDTRANS_SERVER_KEY is not set in secrets");
      return new Response(JSON.stringify({ error: "Server configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Baca Payload Webhook Midtrans
    const payload = await req.json().catch(() => null);
    if (!payload || !payload.order_id || !payload.status_code || !payload.gross_amount) {
      console.warn("[midtrans-notification] Payload tidak lengkap:", payload);
      return new Response(JSON.stringify({ error: "Payload webhook tidak valid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      settlement_time,
    } = payload;

    // 3. Verifikasi SHA-512 Signature Key: order_id + status_code + gross_amount + ServerKey
    const rawSignatureStr = `${order_id}${status_code}${gross_amount}${midtransServerKey}`;
    const calculatedSignature = await calculateSha512(rawSignatureStr);

    if (calculatedSignature.toLowerCase() !== String(signature_key || "").toLowerCase()) {
      console.error("[midtrans-notification] Signature Key mismatch! Ditolak demi keamanan.");
      return new Response(JSON.stringify({ error: "Signature key tidak valid" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Inisialisasi Supabase Admin Client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 5. Cari Record Pembayaran di public.payment
    const { data: paymentRecord, error: payErr } = await supabaseAdmin
      .from("payment")
      .select("*, transaction:transactions(*)")
      .eq("midtrans_order_id", order_id)
      .maybeSingle();

    if (payErr || !paymentRecord) {
      console.error("[midtrans-notification] Payment record tidak ditemukan untuk order_id:", order_id);
      return new Response(JSON.stringify({ error: "Payment record tidak ditemukan di database" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Validasi Kesesuaian Nominal (Mencegah Tampering)
    const notificationAmount = Math.round(Number(gross_amount));
    if (notificationAmount !== Number(paymentRecord.amount)) {
      console.error(
        `[midtrans-notification] Nominal tidak cocok! Database: ${paymentRecord.amount}, Notifikasi: ${notificationAmount}`
      );
      return new Response(JSON.stringify({ error: "Nominal transaksi tidak cocok dengan database" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Pemetaan Status Midtrans ke Status Internal Aplikasi
    let targetPaymentStatus = "pending";
    if (transaction_status === "capture") {
      if (fraud_status === "challenge") {
        targetPaymentStatus = "pending";
      } else if (fraud_status === "accept") {
        targetPaymentStatus = "paid";
      }
    } else if (transaction_status === "settlement") {
      targetPaymentStatus = "paid";
    } else if (transaction_status === "cancel" || transaction_status === "deny") {
      targetPaymentStatus = "failed";
    } else if (transaction_status === "expire") {
      targetPaymentStatus = "expired";
    } else if (transaction_status === "pending") {
      targetPaymentStatus = "pending";
    } else if (transaction_status === "refund" || transaction_status === "partial_refund") {
      targetPaymentStatus = "refunded";
    }

    // 8. Penanganan Notifikasi Idempoten (Jika status sudah sama, tidak ulangi efek samping)
    if (paymentRecord.payment_status === targetPaymentStatus) {
      console.log(`[midtrans-notification] Notifikasi idempoten diabaikan (status sudah ${targetPaymentStatus}).`);
      return new Response(
        JSON.stringify({ status: "success", message: "Notifikasi sudah diproses sebelumnya (idempotent)" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Perbarui Tabel public.payment
    const updatePayload: Record<string, any> = {
      payment_status: targetPaymentStatus,
      payment_method: payment_type || paymentRecord.payment_method,
      midtrans_transaction_id: transaction_id || paymentRecord.midtrans_transaction_id,
      raw_response: payload,
      updated_at: new Date().toISOString(),
    };

    if (targetPaymentStatus === "paid") {
      updatePayload.paid_at = settlement_time || new Date().toISOString();
    }

    const { error: updatePayErr } = await supabaseAdmin
      .from("payment")
      .update(updatePayload)
      .eq("id", paymentRecord.id);

    if (updatePayErr) {
      console.error("[midtrans-notification] Gagal memperbarui status payment:", updatePayErr);
      return new Response(JSON.stringify({ error: "Gagal memperbarui status di database" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 10. Perbarui Status Transaksi Terkait di public.transactions
    const trx = paymentRecord.transaction;
    if (trx) {
      if (targetPaymentStatus === "paid") {
        // Pembayaran sukses: status tetap 'Berjalan' (menunggu penerimaan barang fisik),
        // tetapi notes diperbarui dengan bukti lunas Midtrans.
        let parsedNotes: any = {};
        try {
          if (typeof trx.notes === "string" && trx.notes.trim().startsWith("{")) {
            parsedNotes = JSON.parse(trx.notes);
          } else if (trx.notes && typeof trx.notes === "object") {
            parsedNotes = { ...trx.notes };
          } else if (trx.notes) {
            parsedNotes = { note: String(trx.notes) };
          }
        } catch (_) {}

        parsedNotes.paymentStatus = "paid";
        parsedNotes.paymentMethod = payment_type || "Midtrans Sandbox";
        parsedNotes.paidAt = settlement_time || new Date().toISOString();
        parsedNotes.midtransOrderId = order_id;

        await supabaseAdmin
          .from("transactions")
          .update({
            notes: JSON.stringify(parsedNotes),
          })
          .eq("id", trx.id);

        // Buat Notifikasi Real-time untuk Pembeli & Petani
        const notifPayloads = [];
        if (trx.buyer_id) {
          notifPayloads.push({
            user_id: trx.buyer_id,
            role: "buyer",
            type: "payment_success",
            title: "Pembayaran Berhasil Diverifikasi",
            message: `Pembayaran sebesar Rp ${Number(gross_amount).toLocaleString("id-ID")} untuk ${trx.commodity_name} telah berhasil diverifikasi oleh Midtrans.`,
            related_id: trx.id,
            related_type: "payment",
            read: false,
          });
        }
        if (trx.farmer_id) {
          notifPayloads.push({
            user_id: trx.farmer_id,
            role: "farmer",
            type: "payment_received",
            title: "Pembayaran Diterima di Escrow",
            message: `Pembeli telah melunasi pembayaran untuk ${trx.commodity_name} (Rp ${Number(gross_amount).toLocaleString("id-ID")}). Dana tersimpan aman di sistem penjamin.`,
            related_id: trx.id,
            related_type: "payment",
            read: false,
          });
        }

        if (notifPayloads.length > 0) {
          await supabaseAdmin.from("notifications").insert(notifPayloads).catch(() => {});
        }
      } else if (targetPaymentStatus === "expired" || targetPaymentStatus === "cancelled") {
        // Jika pembayaran kedaluwarsa/dibatalkan dan barang belum diterima, batalkan transaksi
        if (trx.goods_status !== "diterima" && trx.status !== "Selesai") {
          await supabaseAdmin
            .from("transactions")
            .update({ status: "Dibatalkan" })
            .eq("id", trx.id);
        }
      }
    }

    console.log(`[midtrans-notification] Sukses memproses ${order_id} -> status: ${targetPaymentStatus}`);
    return new Response(
      JSON.stringify({
        status: "success",
        order_id,
        payment_status: targetPaymentStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[midtrans-notification] Exception:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: err.message || err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
