import React from 'react';
import HargaPasarView from '../common/HargaPasarView';

export default function FarmerMarketPrice({ marketPrices = [] }) {
  return <HargaPasarView marketPrices={marketPrices} />;
}

