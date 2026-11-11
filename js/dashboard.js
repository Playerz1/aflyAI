/* =========================================================
   PROSPECTA IA — js/dashboard.js
   Dashboard financeiro: KPIs, gráficos SVG e listas recentes
   Com skeleton loading, filtro de período funcional e dados reais
   ========================================================= */

(function () {
  var P = window.Prospecta;
  var D = window.Prospecta.api;

  var els = {
    revenue: document.getElementById("kpi-revenue"),
    revenueChange: document.getElementById("kpi-revenue-change-text"),
    mrr: document.getElementById("kpi-mrr"),
    mrrChange: document.getElementById("kpi-mrr-change-text"),
    avgTicket: document.getElementById("kpi-avg-ticket"),
    avgTicketChange: document.getElementById("kpi-avg-ticket-change-text"),
    totalSales: document.getElementById("kpi-total-sales"),
    totalSalesChange: document.getElementById("kpi-total-sales-change-text"),
    activeClients: document.getElementById("kpi-active-clients"),
    activeClientsChange: document.getElementById("kpi-active-clients-change-text"),
    conversion: document.getElementById("kpi-conversion"),
    conversionChange: document.getElementById("kpi-conversion-change-text"),
    summaryOneTime: document.getElementById("summary-one-time"),
    summaryRecurring: document.getElementById("summary-recurring"),
    recentSales: document.getElementById("list-recent-sales"),
    recentClients: document.getElementById("list-recent-clients"),
    recentActivities: document.getElementById("list-recent-activities"),
    recentProspects: document.getElementById("list-recent-prospects"),
    charts: {
      revenue: document.getElementById("chart-revenue"),
      mrr: document.getElementById("chart-mrr"),
      salesType: document.getElementById("chart-sales-type"),
      conversion: document.getElementById("chart-conversion"),
    },
  };

  var period = "30d";
  var isLoading = false;

  /* ---------- Skeleton helpers ---------- */
  function showSkeleton(el, count) {
    if (!el) return;
    var html = '';
    for (var i = 0; i < count; i++) {
      html += '<div class="list-row skeleton" style="padding:14px 0;border-bottom:none"><div class="skeleton" style="width:36px;height:36px;border-radius:50%;margin-right:14px"></div><div style="flex:1;min-width:0"><div class="skeleton" style="width:60%;height:16px;margin-bottom:6px"></div><div class="skeleton" style="width:40%;height:14px"></div></div><div class="skeleton" style="width:80px;height:16px"></div></div>';
    }
    el.innerHTML = html;
  }

  function hideSkeleton() {}

  /* ---------- Helpers ---------- */
  function fmtMoney(v) { return P.dinheiro(v); }
  function fmtNum(v) { return P.numero(v); }

  function parseDateSafe(iso) {
    var d = new Date(iso);
    return isNaN(d) ? null : d;
  }

  function daysAgo(iso, days) {
    if (!iso) return false;
    var d = new Date(iso);
    if (isNaN(d)) return false;
    var now = new Date();
    return (now - d) <= days * 24 * 60 * 60 * 1000;
  }

  function groupByMonth(data, dateField, valueField) {
    var months = {};
    var now = new Date();
    for (var i = 11; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, "0");
      months[key] = { label: m.toLocaleDateString("pt-BR", { month: "short" }), value: 0 };
    }
    data.forEach(function (item) {
      var d = parseDateSafe(item[dateField]);
      if (!d) return;
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      if (months[key]) months[key].value += Number(item[valueField] || 0);
    });
    return Object.values(months);
  }

  function drawAreaChart(container, points, options) {
    options = options || {};
    var width = container.clientWidth || 500;
    var height = container.clientHeight || 200;
    var pad = 40;

    var max = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([1]));
    var minX = pad;
    var maxX = width - 20;
    var minY = height - 40;
    var maxY = 20;

    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.display = "block";

    // Gradient
    var defs = document.createElementNS(svgNS, "defs");
    var grad = document.createElementNS(svgNS, "linearGradient");
    grad.setAttribute("id", "grad-" + options.id);
    grad.setAttribute("x1", "0"); grad.setAttribute("y1", "0");
    grad.setAttribute("x2", "0"); grad.setAttribute("y2", "1");
    var stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%"); stop1.setAttribute("stop-color", options.color || "#3985FF"); stop1.setAttribute("stop-opacity", "0.25");
    var stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%"); stop2.setAttribute("stop-color", options.color || "#3985FF"); stop2.setAttribute("stop-opacity", "0");
    grad.appendChild(stop1); grad.appendChild(stop2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    // Area path
    var areaPath = document.createElementNS(svgNS, "path");
    var d = "M " + minX + " " + minY + " ";
    points.forEach(function (p, i) {
      var x = minX + (i / (points.length - 1)) * (maxX - minX);
      var y = minY - (p.value / max) * (minY - maxY);
      d += "L " + x.toFixed(1) + " " + y.toFixed(1) + " ";
    });
    d += "L " + maxX + " " + minY + " Z";
    areaPath.setAttribute("d", d);
    areaPath.setAttribute("fill", "url(#grad-" + options.id + ")");
    svg.appendChild(areaPath);

    // Line path
    var linePath = document.createElementNS(svgNS, "path");
    var ld = "M ";
    points.forEach(function (p, i) {
      var x = minX + (i / (points.length - 1)) * (maxX - minX);
      var y = minY - (p.value / max) * (minY - maxY);
      ld += (i === 0 ? "M " : "L ") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    });
    linePath.setAttribute("d", ld);
    linePath.setAttribute("fill", "none");
    linePath.setAttribute("stroke", options.color || "#3985FF");
    linePath.setAttribute("stroke-width", "2");
    linePath.setAttribute("stroke-linecap", "round");
    linePath.setAttribute("stroke-linejoin", "round");
    svg.appendChild(linePath);

    // Points
    points.forEach(function (p, i) {
      var x = minX + (i / (points.length - 1)) * (maxX - minX);
      var y = minY - (p.value / max) * (minY - maxY);
      var circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x.toFixed(1));
      circle.setAttribute("cy", y.toFixed(1));
      circle.setAttribute("r", "3");
      circle.setAttribute("fill", options.color || "#3985FF");
      svg.appendChild(circle);
    });

    // Labels X
    points.forEach(function (p, i) {
      var x = minX + (i / (points.length - 1)) * (maxX - minX);
      var label = document.createElement("div");
      label.style.position = "absolute";
      label.style.left = (x - 15) + "px";
      label.style.top = (minY + 5) + "px";
      label.style.fontSize = "10px";
      label.style.color = P.esc ? P.esc("#8996aa") : "#8996aa";
      label.style.textAlign = "center";
      label.style.width = "30px";
      label.textContent = p.label;
      container.parentElement.appendChild(label);
    });

    container.innerHTML = "";
    container.appendChild(svg);
  }

  /* ---------- Carregar dados ---------- */
  async function loadDashboard() {
    if (isLoading) return;
    isLoading = true;

    // Show skeletons
    showSkeleton(els.recentSales, 5);
    showSkeleton(els.recentClients, 5);
    showSkeleton(els.recentActivities, 5);
    showSkeleton(els.recentProspects, 5);

    try {
      var payments = [], contracts = [], leads = [], users = [], activities = [];

      try {
        var p = await D("/api/payments");
        payments = p && p.payments ? p.payments : (Array.isArray(p) ? p : []);
      } catch (e) { console.warn("payments API", e); }

      try {
        var c = await D("/api/contracts");
        contracts = c && c.contracts ? c.contracts : (Array.isArray(c) ? c : []);
      } catch (e) { console.warn("contracts API", e); }

      try {
        var l = await D("/api/leads");
        leads = l && l.leads ? l.leads : (Array.isArray(l) ? l : []);
      } catch (e) { console.warn("leads API", e); }

      try {
        var u = await D("/api/users");
        users = u && u.users ? u.users : (Array.isArray(u) ? u : []);
      } catch (e) { console.warn("users API", e); }

      try {
        var a = await D("/api/activities");
        activities = a && a.activities ? a.activities : (Array.isArray(a) ? a : []);
      } catch (e) { console.warn("activities API", e); }

      renderKPIs(payments, contracts, leads, users);
      renderCharts(payments, contracts);
      renderLists(payments, contracts, leads, users, activities);
    } catch (err) {
      console.error("Dashboard error", err);
    } finally {
      isLoading = false;
    }
  }

  function renderKPIs(payments, contracts, leads, users) {
    // Apply period filter
    var periodDays = { today: 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[period] || 30;
    var now = new Date();

    var received = payments.filter(function (p) {
      return (p.status === "pago" || p.status === "recebido") && daysAgo(p.paidAt || p.createdAt, periodDays);
    });
    var revenue = received.reduce(function (s, p) { return s + Number(p.value || 0); }, 0);

    var activeContracts = contracts.filter(function (c) {
      return (c.status === "ativo" || c.status === "active") && daysAgo(c.createdAt, periodDays);
    });
    var mrr = activeContracts.reduce(function (s, c) { return s + Number(c.value || 0); }, 0);

    var totalSales = contracts.filter(function (c) { return daysAgo(c.createdAt, periodDays); }).length;
    var avgTicket = totalSales > 0 ? revenue / totalSales : 0;

    var activeClients = users.filter(function (u) {
      return (u.status === "ativo" || u.status === "active") && daysAgo(u.createdAt, periodDays);
    }).length;

    var totalLeads = leads.filter(function (l) { return daysAgo(l.createdAt, periodDays); }).length;
    var convertedLeads = leads.filter(function (l) {
      return (l.status === "fechado" || l.status === "closed") && daysAgo(l.createdAt, periodDays);
    }).length;
    var conversion = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Previous period for change
    var prevStart = new Date(now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000);
    var prevEnd = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    var prevReceived = payments.filter(function (p) {
      return (p.status === "pago" || p.status === "recebido") &&
        new Date(p.paidAt || p.createdAt) >= prevStart &&
        new Date(p.paidAt || p.createdAt) < prevEnd;
    });
    var prevRevenue = prevReceived.reduce(function (s, p) { return s + Number(p.value || 0); }, 0);

    var prevContracts = contracts.filter(function (c) {
      return (c.status === "ativo" || c.status === "active") &&
        new Date(c.createdAt) >= prevStart && new Date(c.createdAt) < prevEnd;
    });
    var prevMrr = prevContracts.reduce(function (s, c) { return s + Number(c.value || 0); }, 0);

    els.revenue.textContent = fmtMoney(revenue);
    var revChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    els.revenueChange.textContent = (revChange >= 0 ? "+" : "") + revChange.toFixed(1).replace(".", ",") + "%";
    els.revenueChange.className = "kpi__change " + (revChange >= 0 ? "kpi__change--up" : "kpi__change--down");

    els.mrr.textContent = fmtMoney(mrr);
    var mrrChange = prevMrr > 0 ? ((mrr - prevMrr) / prevMrr) * 100 : 0;
    els.mrrChange.textContent = (mrrChange >= 0 ? "+" : "") + mrrChange.toFixed(1).replace(".", ",") + "%";
    els.mrrChange.className = "kpi__change " + (mrrChange >= 0 ? "kpi__change--up" : "kpi__change--down");

    els.avgTicket.textContent = fmtMoney(avgTicket);
    els.totalSales.textContent = fmtNum(totalSales);
    els.activeClients.textContent = fmtNum(activeClients);
    els.conversion.textContent = conversion.toFixed(1).replace(".", ",") + "%";

    els.summaryOneTime.textContent = fmtMoney(Math.max(0, revenue - mrr));
    els.summaryRecurring.textContent = fmtMoney(mrr);
  }

  function renderCharts(payments, contracts) {
    var now = new Date();

    // Revenue by month (payments) - last 12 months regardless of period for trend
    var revPoints = payments.filter(function (p) { return p.status === "pago" || p.status === "recebido"; }).reduce(function (acc, p) {
      var d = parseDateSafe(p.paidAt || p.createdAt);
      if (!d) return acc;
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      var found = acc.find(function (a) { return a.key === key; });
      if (found) found.value += Number(p.value || 0);
      return acc;
    }, []);
    var revMap = {};
    revPoints.forEach(function (p) { revMap[p.key] = p; });
    var revFinal = [];
    for (var i = 11; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, "0");
      revFinal.push({ key: key, label: m.toLocaleDateString("pt-BR", { month: "short" }), value: revMap[key] ? revMap[key].value : 0 });
    }

    // MRR by month (active contracts)
    var mrrPoints = contracts.filter(function (c) { return c.status === "ativo" || c.status === "active"; }).reduce(function (acc, c) {
      var d = parseDateSafe(c.createdAt);
      if (!d) return acc;
      var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      var found = acc.find(function (a) { return a.key === key; });
      if (found) found.value += Number(c.value || 0);
      return acc;
    }, []);
    var mrrMap = {};
    mrrPoints.forEach(function (p) { mrrMap[p.key] = p; });
    var mrrFinal = [];
    for (var i = 11; i >= 0; i--) {
      var m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var key = m.getFullYear() + "-" + String(m.getMonth() + 1).padStart(2, "0");
      mrrFinal.push({ key: key, label: m.toLocaleDateString("pt-BR", { month: "short" }), value: mrrMap[key] ? mrrMap[key].value : 0 });
    }

    // Sales type: unique vs recurring
    var oneTime = revenue - mrr;
    var recurring = mrr;

    // Conversion: leads to contracts
    var totalLeads = leads.length;
    var converted = contracts.length;

    drawAreaChart(els.charts.revenue, revFinal, { id: "rev", color: "#3985FF" });
    drawAreaChart(els.charts.mrr, mrrFinal, { id: "mrr", color: "#00D4FF" });
    drawAreaChart(els.charts.salesType, [
      { label: "Únicas", value: Math.max(0, oneTime) },
      { label: "Recorrentes", value: Math.max(0, recurring) }
    ], { id: "type", color: "#22D3EE" });
    drawAreaChart(els.charts.conversion, [
      { label: "Prospecções", value: totalLeads },
      { label: "Convertidas", value: converted }
    ], { id: "conv", color: "#10B981" });
  }

  function renderLists(payments, contracts, leads, users, activities) {
    // Recent sales (payments received)
    var periodDays = { today: 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[period] || 30;
    var recentSales = payments
      .filter(function (p) { return (p.status === "pago" || p.status === "recebido") && daysAgo(p.paidAt || p.createdAt, periodDays); })
      .sort(function (a, b) { return new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt); })
      .slice(0, 5);
    els.recentSales.innerHTML = recentSales.map(function (s) {
      return '' +
        '<div class="list-row">' +
        '<div class="list-row__avatar">' + P.iniciais(s.clientName || s.client_email || "C") + '</div>' +
        '<div class="list-row__info">' +
        '<div class="list-row__title">' + P.esc(s.clientName || s.client_email || "Cliente") + '</div>' +
        '<div class="list-row__meta">' + P.dataHoraBR(s.paidAt || s.createdAt) + '</div>' +
        '</div>' +
        '<div class="list-row__value">' + P.dinheiro(s.value) + '</div>' +
        '</div>';
    }).join("") || '<div style="text-align:center;padding:24px;color:var(--text-muted)">Sem vendas recentes.</div>';

    // Recent clients (users active)
    var recentClients = users
      .sort(function (a, b) { return new Date(b.createdAt || b.criado) - new Date(a.createdAt || a.criado); })
      .slice(0, 5);
    els.recentClients.innerHTML = recentClients.map(function (u) {
      return '' +
        '<div class="list-row">' +
        '<div class="list-row__avatar">' + P.iniciais(u.name || u.nome || "U") + '</div>' +
        '<div class="list-row__info">' +
        '<div class="list-row__title">' + P.esc(u.name || u.nome || "Usuário") + '</div>' +
        '<div class="list-row__meta">' + P.esc(u.email) + ' · ' + (u.role === "admin" ? "Admin" : "Cliente") + '</div>' +
        '</div>' +
        '<span class="badge badge--secondary">' + (u.status === "ativo" || u.status === "active" ? "Ativo" : u.status) + '</span>' +
        '</div>';
    }).join("") || '<div style="text-align:center;padding:24px;color:var(--text-muted)">Sem clientes.</div>';

    // Recent activities
    els.recentActivities.innerHTML = activities
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 5)
      .map(function (a) {
        return '' +
          '<div class="list-row">' +
          '<div class="list-row__avatar" style="background:var(--border);color:var(--text-muted)">' + P.iniciais(a.title) + '</div>' +
          '<div class="list-row__info">' +
          '<div class="list-row__title">' + P.esc(a.title) + '</div>' +
          '<div class="list-row__meta">' + P.esc(a.description || "") + ' · ' + P.dataHoraBR(a.createdAt) + '</div>' +
          '</div>' +
          '</div>';
      }).join("") || '<div style="text-align:center;padding:24px;color:var(--text-muted)">Sem atividades.</div>';

    // Recent prospects (leads)
    els.recentProspects.innerHTML = leads
      .sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); })
      .slice(0, 5)
      .map(function (l) {
        var statusClass = l.status === "fechado" || l.status === "closed" ? "badge--primary" : "badge--secondary";
        var statusLabel = l.status === "fechado" || l.status === "closed" ? "Fechado" : (l.status === "novo" ? "Novo" : l.status);
        return '' +
          '<div class="list-row">' +
          '<div class="list-row__avatar">' + P.iniciais(l.name || l.nome || "L") + '</div>' +
          '<div class="list-row__info">' +
          '<div class="list-row__title">' + P.esc(l.name || l.nome || "Lead") + '</div>' +
          '<div class="list-row__meta">' + P.esc(l.company || l.empresa || "") + ' · ' + P.dataHoraBR(l.createdAt) + '</div>' +
          '</div>' +
          '<span class="badge ' + statusClass + '">' + statusLabel + '</span>' +
          '</div>';
      }).join("") || '<div style="text-align:center;padding:24px;color:var(--text-muted)">Sem prospecções.</div>';
  }

  /* ---------- Filtro de período ---------- */
  document.querySelectorAll("[data-period]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-period]").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      period = btn.getAttribute("data-period");
      loadDashboard();
    });
  });

  /* ---------- Init ---------- */
  if (document.getElementById("kpi-revenue")) {
    loadDashboard();
    setInterval(loadDashboard, 60000);
  }
})();
