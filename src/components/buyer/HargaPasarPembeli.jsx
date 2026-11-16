import React from 'react';
import HargaPasarView from '../common/HargaPasarView';

export default function BuyerMarketPrice({ marketPrices = [] }) {
  return <HargaPasarView marketPrices={marketPrices} />;
}

