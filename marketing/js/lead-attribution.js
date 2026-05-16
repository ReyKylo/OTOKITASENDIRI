(function(){
  const names={offline:'Offline Poster',tiktok_organic:'TikTok Organic',tiktok_ads:'TikTok Ads',meta_ads:'Meta Ads',partnership:'Partnership',unknown:'Unknown'};
  function sourceOfLead(l){const s=l.lead_source||{}; return s.channel||'unknown';}
  function sourceName(channel){return names[channel]||channel||'Unknown';}
  function campaignNameFromLead(l){const s=l.lead_source||{};return s.campaign_name||s.tracking_code||s.campaign_id||'-';}
  function leadsByChannel(month){return window.storage.list('leads',l=>!month||String(l.created_at||l.date||'').slice(0,7)===month).reduce((a,l)=>{const c=sourceOfLead(l);a[c]=(a[c]||0)+1;return a;},{});}
  function dealChannel(deal){if(deal.lead_source?.channel) return deal.lead_source.channel; if(deal.lead_id){const lead=window.storage.get('leads',deal.lead_id); if(lead) return sourceOfLead(lead);} return 'unknown';}
  function spendByChannel(month){const out={offline:0,tiktok_ads:0,meta_ads:0,partnership:0,tiktok_organic:0}; window.storage.list('offline_batches').forEach(x=>{if(!month||String(x.spread_date||'').slice(0,7)===month) out.offline+=Number(x.print_cost||0)+Number(x.distribution_cost||0);}); window.storage.list('tiktok_ad_metrics').forEach(x=>{if(!month||String(x.snapshot_date||'').slice(0,7)===month) out.tiktok_ads+=Number(x.spend_to_date||0);}); window.storage.list('meta_metrics').forEach(x=>{if(!month||String(x.snapshot_date||'').slice(0,7)===month) out.meta_ads+=Number(x.spend_to_date||0);}); window.storage.list('partner_payments').forEach(x=>{if(!month||String(x.period_month||'')===month) out.partnership+=Number(x.amount||0);}); return out;}
  function dealsByChannel(month){return window.storage.list('deals',d=>!month||String(d.created_at||d.date||d.start_date||'').slice(0,7)===month).reduce((a,d)=>{const c=dealChannel(d);a[c]=(a[c]||0)+1;return a;},{});}
  function feeByChannel(month){return window.storage.list('deals',d=>!month||String(d.created_at||d.date||d.start_date||'').slice(0,7)===month).reduce((a,d)=>{const c=dealChannel(d);a[c]=(a[c]||0)+Math.max(Number(d.total_tebus||0)-Number(d.principal||0),0);return a;},{});}
  window.attribution={sourceOfLead,sourceName,campaignNameFromLead,leadsByChannel,spendByChannel,dealsByChannel,feeByChannel};
})();
