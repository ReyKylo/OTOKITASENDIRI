(function(){
  'use strict';

  function humanizeKey(key){
    const last = String(key || '').split('.').pop() || '';
    return last.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const INLINE = {
    id: {
      shared:{save:'Simpan',cancel:'Batal',delete:'Hapus',edit:'Edit',search:'Cari',add:'Tambah',export_json:'Export JSON',import_json:'Import JSON',reset:'Reset',settings:'Settings',role:'Role',language:'Bahasa',logout:'Keluar',open:'Buka',view_detail:'View Detail',target:'Target',min:'Min',max:'Max',achievement:'Pencapaian',period:'Periode',status:'Status',refresh:'Refresh',back_home:'← Home'},
      homepage:{welcome:'Selamat datang di OTOKITA Internal System',choose_module:'Pilih Module',kpi_saya:'KPI Saya',no_personal_kpi:'Belum ada KPI personal. Manager bisa assign di Management module.',recent_activity:'Recent Activity'},
      operational:{module:'Operational',dashboard:'Dashboard',calculator:'Calculator',leads:'Leads',inventory:'Inventory',kpi_sales:'KPI Sales',kpi_bulan_ini:'KPI Bulan Ini',sales_kpi:'KPI Sales'},
      financial:{module:'Financial',jurnal:'Jurnal',ledger:'Buku Besar',reports:'Laporan',motor_sitaan:'Motor Sitaan'},
      marketing:{module:'Marketing',offline:'Offline Poster',tiktok:'TikTok',meta:'Meta Ads',partners:'Partnership',assets:'Assets',reports:'Reports'},
      management:{module:'Management',dashboard:'Dashboard',okr:'OKR',kpi:'KPI',employee:'Employee',planning:'Planning',reports:'Reports',global_kpi:'Global KPI',employee_kpi:'Per-Employee KPI',assign_kpi:'Assign KPI ke Employee'},
      suite:{home:'Home',operational:'Operational',financial:'Financial',marketing:'Marketing',management:'Management',local_mode:'Local Mode'},
      suite_dashboard:{
        control_center:'Control Center',open_module:'Open Module',quick_actions:'Aksi Cepat',this_month:'Bulan ini',today:'Hari ini',data_live:'Data live dari localStorage',view_reports:'Lihat Laporan',view_detail:'View Detail',new_intake:'+ New Intake',manual_journal:'+ Jurnal Manual',new_campaign:'+ Aktivitas Marketing',new_task:'+ Task',
        operational_title:'Dashboard Operational',operational_subtitle:'Pantau leads, deal aktif, jatuh tempo, dan performa sales harian.',total_leads:'Total Leads',active_deals:'Deal Aktif',due_alerts:'Alert Jatuh Tempo',principal:'Total Pencairan',conversion:'Conversion',followup:'Follow-up',inventory:'Inventory',
        financial_title:'Dashboard Financial',financial_subtitle:'Kontrol kas, revenue, expense, jurnal, komisi, dan laporan investor.',cash:'Kas Tersedia',revenue:'Pendapatan',expense:'Beban',net_income:'Laba Bersih',journal:'Jurnal',reports:'Laporan',import_ops:'Import OPS JSON',
        marketing_title:'Dashboard Marketing',marketing_subtitle:'Lihat spending, channel attribution, campaign, dan asset marketing.',spend:'Marketing Spend',leads:'Leads',campaigns:'Campaign',videos:'Videos',cpl:'CPL',poster:'Poster',partnership:'Partnership',
        management_title:'Dashboard Management',management_subtitle:'Command center untuk OKR, KPI, planning, employee, dan cross-module alert.',okr_avg:'OKR Avg',tasks:'Tasks',employees:'Employees',pinned_kpi:'Pinned KPI',planning:'Planning',employee:'Employee',
        chart_area:'Grafik & Insight',pending_area:'Action Queue',snapshot:'Snapshot',empty:'Belum ada data.'
      },
      kpi_employee:{kpi_saya:'KPI Saya',target_pencairan:'Target Pencairan',current:'Current',target_range:'Target Range',time_remaining:'Sisa waktu',total_deal:'Total Deal',avg_deal_size:'Avg Deal Size',conversion_rate:'Conversion Rate',below:'Belum capai',min_reached:'Minimum tercapai',max_reached:'Target tercapai',exceeded:'Exceeded'},
      module_operational:'Operational Module',module_financial:'Financial Module',module_name:'Marketing Module',management_module:'Management Module',
      nav_dashboard:'Dashboard',nav_calculator:'Calculator',nav_leads:'Leads',nav_inventory:'Inventory',nav_jurnal:'Jurnal',nav_ledger:'Buku Besar',nav_reports:'Laporan',nav_offline:'Offline Poster',nav_tiktok:'TikTok',nav_meta:'Meta Ads',nav_partners:'Partnership',nav_assets:'Assets',
      role_label:'Role',role:'Role',save_json:'Save JSON',export_json:'Export JSON',import_json:'Import JSON',access_denied:'Akses ditolak',access_denied_desc:'Role ini tidak punya akses.',
      dashboard_eyebrow:'Monitoring harian',dashboard_title:'Dashboard',quick_new_intake:'+ New Intake',quick_view_leads:'View Leads',quick_view_inventory:'View Inventory',chart_leads_status:'Leads per Status',chart_deals_product:'Deals per Produk',followup_today:'Follow-up Hari Ini',pending_approval:'Pending Approval',alert_deals:'Alert Deals',top_sales_month:'Top Sales Bulan Ini',
      chart_rev_exp:'Pendapatan vs Beban 6 Bulan',chart_revenue_mix:'Komposisi Pendapatan',pending_entries:'Pending Journal Entries',review_all:'Review Semua',recent_journal:'Recent Journal Entries',view_all:'View All',pending_wage_actions:'Pending Wage Actions',motor_sitaan_pending_sale:'Motor Sitaan Pending Sale',quick_manual_journal:'+ Jurnal Manual',quick_reports:'Lihat Laporan',quick_pdf_month:'Export PDF Bulan Ini',quick_import_cashflow:'Import OPS JSON',wage:'Wage',motor_sitaan:'Motor Sitaan',
      quick_add_campaign:'+ Tambah Aktivitas',view_reports:'Lihat Laporan',chart_leads_channel:'Leads per Channel',chart_spend_channel:'Spend per Channel',recent_leads:'Recent Leads',top_campaigns:'Top Campaigns',pending_finance_posts:'Pending Finance Posts',
      dashboard:'Dashboard',okr:'OKR',kpi:'KPI',employee:'Employee',planning:'Planning',reports:'Reports',settings:'Settings',language:'Bahasa',save_settings:'Save Settings',reset_all:'Reset All',okr_score:'OKR Score',quick_actions:'Quick Actions',new_okr:'+ New OKR',new_task:'+ New Task',new_employee:'+ New Employee',active_okr:'Active OKR',today_tasks:"Today's Tasks",pinned_kpi:'Pinned KPI',alerts:'Cross-Module Alerts',export_pdf:'Export PDF'
    },
    zh: {
      shared:{save:'保存',cancel:'取消',delete:'删除',edit:'编辑',search:'搜索',add:'新增',export_json:'导出JSON',import_json:'导入JSON',reset:'重置',settings:'设置',role:'角色',language:'语言',logout:'退出',open:'打开',view_detail:'查看详情',target:'目标',min:'最低',max:'最高',achievement:'完成额',period:'期间',status:'状态',refresh:'刷新',back_home:'← 返回首页'},
      homepage:{welcome:'欢迎使用OTOKITA内部系统',choose_module:'选择模块',kpi_saya:'我的KPI',no_personal_kpi:'暂无个人KPI，经理可在管理模块分配。',recent_activity:'最近动态'},
      operational:{module:'运营',dashboard:'仪表盘',calculator:'计算器',leads:'线索',inventory:'库存/交易',kpi_sales:'销售KPI',kpi_bulan_ini:'本月KPI',sales_kpi:'销售KPI'},
      financial:{module:'财务',jurnal:'日记账',ledger:'总账',reports:'报表',motor_sitaan:'扣押摩托'},
      marketing:{module:'营销',offline:'线下海报',tiktok:'TikTok',meta:'Meta广告',partners:'合作伙伴',assets:'素材库',reports:'报表'},
      management:{module:'管理',dashboard:'仪表盘',okr:'OKR',kpi:'KPI',employee:'员工',planning:'计划',reports:'报表',global_kpi:'全局KPI',employee_kpi:'员工KPI',assign_kpi:'分配员工KPI'},
      suite:{home:'首页',operational:'运营',financial:'财务',marketing:'营销',management:'管理',local_mode:'本地模式'},
      suite_dashboard:{
        control_center:'控制中心',open_module:'打开模块',quick_actions:'快捷操作',this_month:'本月',today:'今天',data_live:'数据来自本地存储',view_reports:'查看报表',view_detail:'查看详情',new_intake:'+ 新客户录入',manual_journal:'+ 手动凭证',new_campaign:'+ 营销活动',new_task:'+ 新任务',
        operational_title:'运营仪表盘',operational_subtitle:'查看线索、活跃交易、到期预警和销售表现。',total_leads:'线索总数',active_deals:'活跃交易',due_alerts:'到期预警',principal:'放款总额',conversion:'转化率',followup:'跟进',inventory:'库存/交易',
        financial_title:'财务仪表盘',financial_subtitle:'控制现金、收入、费用、日记账、佣金和投资人报告。',cash:'可用现金',revenue:'收入',expense:'费用',net_income:'净利润',journal:'日记账',reports:'报表',import_ops:'导入运营JSON',
        marketing_title:'营销仪表盘',marketing_subtitle:'查看投放成本、渠道归因、活动和营销素材。',spend:'营销支出',leads:'线索',campaigns:'活动',videos:'视频',cpl:'获客成本',poster:'海报',partnership:'合作',
        management_title:'管理仪表盘',management_subtitle:'OKR、KPI、计划、员工和跨模块提醒的管理中心。',okr_avg:'OKR平均',tasks:'任务',employees:'员工',pinned_kpi:'置顶KPI',planning:'计划',employee:'员工',
        chart_area:'图表与洞察',pending_area:'待处理事项',snapshot:'快照',empty:'暂无数据。'
      },
      kpi_employee:{kpi_saya:'我的KPI',target_pencairan:'放款目标',current:'当前',target_range:'目标范围',time_remaining:'剩余时间',total_deal:'交易数',avg_deal_size:'平均交易额',conversion_rate:'成交率',below:'未达标',min_reached:'达到最低目标',max_reached:'达到目标',exceeded:'超额完成'},
      module_operational:'运营模块',module_financial:'财务模块',module_name:'营销模块',management_module:'管理模块',
      nav_dashboard:'仪表盘',nav_calculator:'计算器',nav_leads:'线索',nav_inventory:'库存/交易',nav_jurnal:'日记账',nav_ledger:'总账',nav_reports:'报表',nav_offline:'线下海报',nav_tiktok:'TikTok',nav_meta:'Meta广告',nav_partners:'合作伙伴',nav_assets:'素材库',
      role_label:'角色',role:'角色',save_json:'保存JSON',export_json:'导出JSON',import_json:'导入JSON',access_denied:'拒绝访问',access_denied_desc:'当前角色无权访问。',
      dashboard_eyebrow:'每日监控',dashboard_title:'仪表盘',quick_new_intake:'+ 新客户录入',quick_view_leads:'查看线索',quick_view_inventory:'查看库存/交易',chart_leads_status:'按状态统计线索',chart_deals_product:'按产品统计交易',followup_today:'今日跟进',pending_approval:'待审批',alert_deals:'交易预警',top_sales_month:'本月最佳销售',
      chart_rev_exp:'近6个月收入与费用',chart_revenue_mix:'收入结构',pending_entries:'待处理日记账',review_all:'全部审核',recent_journal:'最近日记账',view_all:'查看全部',pending_wage_actions:'工资待办事项',motor_sitaan_pending_sale:'待售扣押摩托',quick_manual_journal:'+ 手动凭证',quick_reports:'查看报表',quick_pdf_month:'导出本月PDF',quick_import_cashflow:'导入运营JSON',wage:'工资',motor_sitaan:'扣押摩托',
      quick_add_campaign:'+ 新增活动',view_reports:'查看报表',chart_leads_channel:'按渠道统计线索',chart_spend_channel:'按渠道统计支出',recent_leads:'最近线索',top_campaigns:'最佳活动',pending_finance_posts:'待入账营销费用',
      dashboard:'仪表盘',okr:'OKR',kpi:'KPI',employee:'员工',planning:'计划',reports:'报表',settings:'设置',language:'语言',save_settings:'保存设置',reset_all:'重置全部',okr_score:'OKR评分',quick_actions:'快捷操作',new_okr:'+ 新OKR',new_task:'+ 新任务',new_employee:'+ 新员工',active_okr:'当前OKR',today_tasks:'今日任务',pinned_kpi:'置顶KPI',alerts:'跨模块提醒',export_pdf:'导出PDF'
    }
  };
  let dict = INLINE.id;
  let lang = 'id';
  function deepMerge(a,b){ if(!b||typeof b!=='object') return a; Object.keys(b).forEach(k=>{ if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){ a[k]=deepMerge(a[k]||{},b[k]); } else { a[k]=b[k]; } }); return a; }
  function get(obj,path){ return String(path||'').split('.').reduce((o,k)=>o&&o[k],obj); }
  function rootPrefix(){ return location.pathname.includes('/operational/')||location.pathname.includes('/financial/')||location.pathname.includes('/marketing/')||location.pathname.includes('/management/') ? '../' : ''; }
  async function load(){
    const settings = window.storage?.getSettings?.() || {};
    lang = settings.language || localStorage.getItem('otokita.lang') || 'id';
    dict = JSON.parse(JSON.stringify(INLINE[lang] || INLINE.id));
    try {
      const r = await fetch(rootPrefix() + 'shared/lang/' + lang + '.json', {cache:'no-store'});
      if (r.ok) dict = deepMerge(dict, await r.json());
    } catch (_) {}
    apply();
  }
  function t(key,fallback){ return get(dict,key) || dict[key] || get(INLINE[lang]||INLINE.id,key) || (INLINE[lang]||INLINE.id)[key] || fallback || humanizeKey(key); }
  function apply(root=document){
    root.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n, el.textContent); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ el.placeholder = t(el.dataset.i18nPlaceholder, el.placeholder); });
    document.documentElement.lang = lang;
  }
  async function setLanguage(next){
    lang = next || (lang === 'id' ? 'zh' : 'id');
    localStorage.setItem('otokita.lang', lang);
    if (window.storage?.saveSettings) window.storage.saveSettings(Object.assign({}, window.storage.getSettings(), {language:lang}));
    await load();
    ['otokita:language-change','language:changed','languageChanged','languagechange'].forEach(name=>{
      window.dispatchEvent(new CustomEvent(name,{detail:{lang,language:lang}}));
      document.dispatchEvent(new CustomEvent(name,{detail:{lang,language:lang}}));
    });
  }
  function toggle(){ return setLanguage(lang === 'id' ? 'zh' : 'id'); }
  function current(){ return lang; }
  function init(){ return load(); }
  window.i18n = {init,load,apply,t,toggle,setLanguage,lang:current,current,INLINE};
})();
