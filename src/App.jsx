import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Activity, DollarSign, Calendar } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

// URL DE TU SCRIPT DE GOOGLE
const API_URL = "https://script.google.com/macros/s/AKfycbyRSwFlD4LaJlpiMD2iTMFcdgb92MOOzoZuCKXXvfVBIAm0q82r3cjWpAJeRECtN67wPA/exec";

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const json = await response.json();
        processData(json);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    const dateOptions = { month: 'long', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('es-PE', dateOptions).toUpperCase());
    
    fetchData();
  }, []);

  const processData = (json) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let bizIngresos = 0;
    let bizGastos = 0;
    let bizNomina = 0;
    
    let perGastos = 0;
    let perDeuda = 0;
    let perCategorias = {};

    // 1. Procesar Empresa
    json.empresa.forEach(row => {
      const fecha = new Date(row[0]);
      if (fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear) {
        const tipo = row[1];
        const monto = parseFloat(String(row[5]).replace(/,/g, '')) || 0;

        if (tipo.includes("Ingreso")) bizIngresos += monto;
        if (tipo.includes("Gasto")) bizGastos += monto;
        if (tipo.includes("Nómina")) bizNomina += monto;
      }
    });

    // 2. Procesar Personal
    json.personal.forEach(row => {
      const fecha = new Date(row[0]);
      if (fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear) {
        const cat = row[1];
        const monto = parseFloat(String(row[3]).replace(/,/g, '')) || 0;
        const metodo = row[4];

        perGastos += monto;
        perCategorias[cat] = (perCategorias[cat] || 0) + monto;

        if (metodo && metodo.toLowerCase().includes("crédito")) {
          perDeuda += monto;
        }
      }
    });

    const bizProfit = bizIngresos - bizGastos - bizNomina;
    const perNominaSoles = bizNomina * json.meta.tc;
    const perSaldo = perNominaSoles - perGastos;

    setData({
      biz: { ingresos: bizIngresos, gastos: bizGastos, profit: bizProfit, nominaUSD: bizNomina },
      per: { nominaPEN: perNominaSoles, gastos: perGastos, saldo: perSaldo, deuda: perDeuda },
      chart: perCategorias,
      tc: json.meta.tc
    });
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center text-brand-blue animate-pulse flex-col">
      <Activity size={48} className="mb-4" />
      <span className="font-mono text-xl tracking-widest">CONECTANDO CON EVO SYSTEM...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 p-4 md:p-6 font-sans selection:bg-brand-blue selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-dark-700 pb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Wallet className="text-brand-blue" /> EVO FINANCIAL OS
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-mono">ESTADO FINANCIERO / {currentDate}</p>
          </div>
          <div className="text-left md:text-right bg-dark-800 p-2 px-4 rounded-lg border border-dark-700">
            <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Tipo de Cambio</div>
            <div className="font-mono font-bold text-brand-green">S/ {data.tc}</div>
          </div>
        </header>

        {/* SECTION: EMPRESA */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-300">
            <span className="w-1 h-6 bg-brand-blue rounded-full shadow-[0_0_10px_#3b82f6]"></span>
            NEGOCIO (USD)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card 
              title="CASH FLOW NETO" 
              amount={`$${data.biz.profit.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle="Caja real disponible"
              color="text-white"
              icon={<DollarSign size={20} className="text-brand-blue"/>}
            />
            <Card 
              title="FACTURACIÓN" 
              amount={`$${data.biz.ingresos.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle="Ingresos brutos"
              color="text-brand-green"
              icon={<TrendingUp size={20} className="text-brand-green"/>}
            />
            <Card 
              title="GASTOS OPERATIVOS" 
              amount={`$${data.biz.gastos.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle="Costos fijos + Ads"
              color="text-brand-red"
              icon={<TrendingDown size={20} className="text-brand-red"/>}
            />
          </div>
        </section>

        {/* SECTION: PERSONAL */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-300">
            <span className="w-1 h-6 bg-brand-green rounded-full shadow-[0_0_10px_#10b981]"></span>
            PERSONAL (PEN)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <Card 
              title="MI NÓMINA" 
              amount={`S/ ${data.per.nominaPEN.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle={`Base: $${data.biz.nominaUSD} USD`}
              color="text-brand-blue"
              icon={<Wallet size={20} className="text-brand-blue"/>}
            />
            <Card 
              title="GASTOS VIDA" 
              amount={`S/ ${data.per.gastos.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle="Consumo acumulado"
              color="text-brand-orange"
              icon={<Activity size={20} className="text-brand-orange"/>}
            />
            <Card 
              title="SALDO DISPONIBLE" 
              amount={`S/ ${data.per.saldo.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle={data.per.saldo > 0 ? "Potencial de ahorro" : "Déficit mensual"}
              color={data.per.saldo < 0 ? "text-brand-red" : "text-white"}
              icon={<Calendar size={20} className="text-slate-400"/>}
              highlight={data.per.saldo < 0}
            />
            <Card 
              title="DEUDA TARJETA" 
              amount={`S/ ${data.per.deuda.toLocaleString('en-US', {minimumFractionDigits: 2})}`} 
              subtitle="A pagar próximo mes"
              color="text-brand-red"
              icon={<CreditCard size={20} className="text-brand-red"/>}
            />
          </div>
        </section>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 col-span-2 shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 mb-6 tracking-widest uppercase flex items-center gap-2">
              <Activity size={14} /> Distribución de Gastos
            </h3>
            <div className="h-64 flex justify-center">
              <Doughnut 
                data={{
                  labels: Object.keys(data.chart),
                  datasets: [{
                    data: Object.values(data.chart),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'],
                    borderWidth: 0,
                    hoverOffset: 10
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '70%',
                  plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, usePointStyle: true, boxWidth: 6 } }
                  }
                }}
              />
            </div>
          </div>
          
          {/* RESUMEN SALUD */}
          <div className="bg-dark-800 p-6 rounded-2xl border border-dark-700 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
            <div className={`absolute top-0 w-full h-1 ${data.per.saldo > 0 ? 'bg-brand-green' : 'bg-brand-red'}`}></div>
            <h3 className="text-xs font-bold text-slate-500 mb-4 tracking-widest uppercase">Diagnóstico Mensual</h3>
            <div className={`text-3xl font-mono font-bold mb-2 ${data.per.saldo > 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              {data.per.saldo > 0 ? 'SALUDABLE' : 'CRÍTICO'}
            </div>
            <p className="text-slate-400 text-sm mt-2 max-w-[200px] leading-relaxed">
              {data.per.saldo > 0 
                ? "Tienes flujo de caja positivo. Este excedente debería ir a tu fondo de emergencia o inversión."
                : "Tus gastos personales han superado tu nómina. Detén gastos discrecionales inmediatamente."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Componente Card
function Card({ title, amount, subtitle, color, icon, highlight }) {
  return (
    <div className={`bg-dark-800 p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${highlight ? 'border-brand-red bg-red-900/10' : 'border-dark-700 hover:border-brand-blue'}`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase">{title}</h3>
        <div className="p-2 bg-dark-900 rounded-lg text-slate-400 border border-dark-700">{icon}</div>
      </div>
      <div className={`text-2xl md:text-3xl font-mono font-bold mb-2 ${color}`}>{amount}</div>
      <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
        {subtitle}
      </div>
    </div>
  );
}

export default App;
