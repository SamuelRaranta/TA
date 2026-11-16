import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val || "");

serve(async (req) => {
  // 1. Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const midtransServerKey = Deno.env.get("MIDTRANS_SERVER_KEY") || "";
    const isProduction = Deno.env.get("MIDTRANS_IS_PRODUCTION") === "true";

    if (!midtransServerKey) {
      console.error("[create-midtrans-transaction] MIDTRANS_SERVER_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server Key Midtrans belum dikonfigurasi di Supabase Secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Supabase Admin Client (Service Role) untuk query database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 3. Autentikasi Pengguna Opsional (Fallback jika token kedaluwarsa atau mode publishable)
    let authenticatedUserId: string | null = null;
    const authHeader = req.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.replace("Bearer ", "").trim();
      if (!rawToken.startsWith("sb_publishable_") && rawToken !== supabaseAnonKey) {
        try {
          const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: { user } } = await supabaseUserClient.auth.getUser();
          if (user?.id) {
            authenticatedUserId = user.id;
          }
        } catch (_) {
          // Token error ditoleransi untuk kelancaran checkout pembayaran
        }
      }
    }

    // 4. Baca Body Request
    const body = await req.json().catch(() => ({}));
    const { transaction_id, payment_method, bank_name, force_new } = body;

    if (!transaction_id) {
      return new Response(
        JSON.stringify({ error: "Parameter transaction_id wajib disertakan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Ambil data transaksi langsung dari database
    let trxQuery = supabaseAdmin
      .from("transactions")
      .select("*, buyer:profiles!transactions_buyer_id_fkey(id, full_name, email, phone)");

    if (isUuid(transaction_id)) {
      trxQuery = trxQuery.eq("id", transaction_id);
    } else {
      trxQuery = trxQuery.eq("transaction_code", transaction_id);
    }

    const { data: trx, error: trxErr } = await trxQuery.maybeSingle();

    if (trxErr || !trx) {
      return new Response(
        JSON.stringify({ error: "Transaksi pesanan tidak ditemukan di database" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Validasi Hak Akses (hanya jika pengguna terautentikasi dan transaksi punya buyer_id)
    if (authenticatedUserId && trx.buyer_id && trx.buyer_id !== authenticatedUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", authenticatedUserId)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return new Response(
          JSON.stringify({ error: "Akses ditolak. Anda bukan pembeli yang berhak membayar transaksi ini." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 7. Validasi Status Transaksi
    if (trx.status === "Dibatalkan") {
      return new Response(
        JSON.stringify({ error: "Transaksi ini telah dibatalkan dan tidak dapat dibayar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Tentukan filter payment method (QRIS vs Transfer Bank)
    const methodStr = String(payment_method || trx.payment_method || "").toLowerCase();
    const bankStr = String(bank_name || "").toLowerCase();

    let enabledPayments: string[] | undefined = undefined;
    let normalizedMethodCategory = "all";

    if (
      methodStr === "qris" ||
      methodStr === "gopay" ||
      methodStr === "shopeepay"
    ) {
      // Jika pengguna secara spesifik memilih QRIS saja
      enabledPayments = ["gopay", "qris", "shopeepay"];
      normalizedMethodCategory = "qris";
    } else {
      // Untuk Transfer Bank & Escrow: sediakan seluruh bank VA (BCA, Mandiri, BRI, BNI, Permata) serta QRIS
      // Tanpa metode asing seperti kartu kredit / cicilan paylater yang tidak relevan
      enabledPayments = [
        "bca_va",
        "bni_va",
        "bri_va",
        "echannel",
        "permata_va",
        "other_va",
        "gopay",
        "qris",
        "shopeepay"
      ];
      normalizedMethodCategory = "bank_transfer";
    }

    // 9. Cek Riwayat Pembayaran (Idempotensi & Pencegahan Pembayaran Ganda)
    const { data: existingPayments } = await supabaseAdmin
      .from("payment")
      .select("*")
      .eq("order_id", trx.id)
      .order("created_at", { ascending: false });

    // Jika sudah lunas
    const paidPayment = existingPayments?.find((p) => p.payment_status === "paid");
    if (paidPayment) {
      return new Response(
        JSON.stringify({ error: "Transaksi ini sudah dibayar lunas sebelumnya" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Jika ada token pending dengan metode yang cocok yang masih aktif (< 23 jam)
    if (!force_new) {
      const activePending = existingPayments?.find(
        (p) =>
          p.payment_status === "pending" &&
          p.snap_token &&
          (!p.payment_method || p.payment_method === normalizedMethodCategory)
      );

      if (activePending) {
        const createdAtMs = new Date(activePending.created_at).getTime();
        const ageHours = (Date.now() - createdAtMs) / (1000 * 60 * 60);
        if (ageHours < 23) {
          return new Response(
            JSON.stringify({
              token: activePending.snap_token,
              redirect_url: activePending.snap_redirect_url,
              order_id: activePending.midtrans_order_id,
              enabled_payments: enabledPayments,
              reused: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 10. Hitung Ulang Nominal Transaksi (Otoritatif dari Database)
    const grossAmount = Math.round(Number(trx.amount || trx.total_value || 0));
    if (grossAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Nominal transaksi tidak valid (harus lebih dari 0)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 11. Buat Unique midtrans_order_id
    const shortCode = (trx.transaction_code || trx.id.slice(0, 8)).replace(/[^A-Za-z0-9_-]/g, "");
    const midtransOrderId = `AGR-${shortCode}-${Date.now().toString().slice(-6)}`;

    // 12. Siapkan Payload Midtrans Snap
    const snapEndpoint = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    const snapPayload: Record<string, any> = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: grossAmount,
      },
      item_details: [
        {
          id: String(trx.id).slice(0, 50),
          price: grossAmount,
          quantity: 1,
          name: String(trx.commodity_name || "Komoditas Pertanian").slice(0, 50),
          category: String(trx.category || "Pertanian").slice(0, 50),
        },
      ],
      customer_details: {
        first_name: String(trx.buyer?.full_name || "Pembeli Mitra").slice(0, 50),
        email: trx.buyer?.email || undefined,
        phone: trx.buyer?.phone || undefined,
      },
      expiry: {
        unit: "day",
        duration: 1,
      },
    };

    if (enabledPayments && enabledPayments.length > 0) {
      snapPayload.enabled_payments = enabledPayments;
    }

    // 13. Panggil Snap API menggunakan Basic Auth Server Key
    const basicAuth = btoa(`${midtransServerKey}:`);
    const snapResponse = await fetch(snapEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify(snapPayload),
    });

    const snapData = await snapResponse.json().catch(() => null);

    if (!snapResponse.ok || !snapData?.token) {
      console.error("[create-midtrans-transaction] Midtrans Snap API error:", snapData);
      return new Response(
        JSON.stringify({
          error: "Gagal membuat sesi pembayaran Midtrans Snap",
          details: snapData?.error_messages || snapData?.message || JSON.stringify(snapData) || "Midtrans API error",
        }),
        { status: snapResponse.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 14. Simpan Catatan Pembayaran ke public.payment
    const { error: insertErr } = await supabaseAdmin.from("payment").insert({
      order_id: trx.id,
      midtrans_order_id: midtransOrderId,
      amount: grossAmount,
      payment_status: "pending",
      payment_method: normalizedMethodCategory,
      snap_token: snapData.token,
      snap_redirect_url: snapData.redirect_url,
    });

    if (insertErr) {
      console.error("[create-midtrans-transaction] Gagal menyimpan payment record:", insertErr);
      return new Response(
        JSON.stringify({
          error: "Sesi token berhasil dibuat, namun gagal disimpan ke database.",
          details: insertErr.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 15. Kembalikan Token ke Frontend (Server Key TIDAK PERNAH dikembalikan)
    return new Response(
      JSON.stringify({
        token: snapData.token,
        redirect_url: snapData.redirect_url,
        order_id: midtransOrderId,
        enabled_payments: enabledPayments,
        reused: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-midtrans-transaction] Exception:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: err.message || err }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
