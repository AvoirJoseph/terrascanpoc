import { useState, useEffect, useMemo } from 'react'
import './App.css'

// Baseline spatial nodes reflecting TUP's agricultural study
const INITIAL_NODES = [
  {
    id: 0,
    name: "P. Science H.S. Garden",
    location: "Parañaque, Manila",
    baselines: { moisture: 42.5, pH: 6.2, temp: 28.4, humidity: 76.2 },
    status: "Normal",
    notes: "Validation garden plot using clay-loam soil profiles."
  },
  {
    id: 1,
    name: "TUP Manila Urban Farm",
    location: "Ermita, Manila",
    baselines: { moisture: 65.2, pH: 6.8, temp: 30.1, humidity: 82.5 },
    status: "Optimal",
    notes: "Vertical micro-gardening arrays powered by ESP32 Field Nodes."
  },
  {
    id: 2,
    name: "Laguna Agri-Tech Hub",
    location: "Calamba, Laguna",
    baselines: { moisture: 78.4, pH: 5.7, temp: 27.2, humidity: 88.1 },
    status: "Acidic Warning",
    notes: "Large-scale paddy rice fields testing spatial multi-node arrays."
  }
];

const BILL_OF_MATERIALS = [
  { name: "ABS Weatherproof Enclosure", cost: 455, color: "#10b981", desc: "Molded ABS shell with high-moisture acrylic face seal." },
  { name: "Analog Soil pH Probe Kit", cost: 280, color: "#8b5cf6", desc: "Chemical-resistant soil probe and signal conditioner board." },
  { name: "ESP32 Microcontroller Core", cost: 180, color: "#3b82f6", desc: "Equipped with built-in Wi-Fi and Bluetooth capabilities." },
  { name: "Character I2C LCD (16x2)", cost: 125, color: "#eab308", desc: "Localized physical screen for instant handheld readouts." },
  { name: "Industrial Soil Moisture Probe", cost: 110, color: "#ec4899", desc: "Corrosion-resistant probe deployed 3 to 5 inches deep." },
  { name: "Isolated DC-to-DC Regulator", cost: 85, color: "#f97316", desc: "Ensures low-voltage safety insulation thresholds in wet soils." },
  { name: "Interconnect Wires & Fasteners", cost: 60, color: "#06b6d4", desc: "Jumper ribbon lines, solder alloys & mechanical fasteners." },
  { name: "DHT11 Atmospheric Sensor", cost: 45, color: "#a855f7", desc: "Tracks atmospheric humidity and temperature above ground." },
  { name: "Eco Packaging & User Manuals", cost: 40, color: "#64748b", desc: "Recyclable boxed packaging, calibration manuals & serial labels." }
];

const FINANCIAL_PROJECTIONS = [
  { year: "Year 1", revenue: 15525000, cogs: 12825000, fixed: 2280000, profit: 336000, margin: "1.94%" },
  { year: "Year 2", revenue: 18292860, cogs: 15134700, fixed: 2368800, profit: 631488, margin: "3.25%" },
  { year: "Year 3", revenue: 21253300, cogs: 17543600, fixed: 2461152, profit: 998838, margin: "4.52%" },
  { year: "Year 4", revenue: 22103432, cogs: 18245344, fixed: 2557199, profit: 1040711, margin: "4.52%" },
  { year: "Year 5", revenue: 22987569, cogs: 18975158, fixed: 2657087, profit: 1084259, margin: "4.53%" }
];

function App() {
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'
  const [activeTab, setActiveTab] = useState('overview');
  const [activeNode, setActiveNode] = useState(0);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(2);
  
  // Real-time sensor states
  const [nodeData, setNodeData] = useState(INITIAL_NODES);
  const [alertTrigger, setAlertTrigger] = useState(null);

  // Add Field Node modal states
  const [showAddNodeModal, setShowAddNodeModal] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeLocation, setNewNodeLocation] = useState('');
  const [newNodeMoisture, setNewNodeMoisture] = useState(50);
  const [newNodePh, setNewNodePh] = useState(6.5);
  
  // Rolling sensor history (last 10 items) for real-time scrolling graph
  const [telemetryHistory, setTelemetryHistory] = useState([
    { moisture: 42, pH: 6.1 }, { moisture: 43, pH: 6.2 }, { moisture: 41, pH: 6.0 },
    { moisture: 42, pH: 6.2 }, { moisture: 44, pH: 6.3 }, { moisture: 43, pH: 6.1 },
    { moisture: 42, pH: 6.2 }, { moisture: 45, pH: 6.2 }, { moisture: 43, pH: 6.1 },
    { moisture: 42.5, pH: 6.2 }
  ]);

  // Financial Break-Even parameters (sliders are monthly equivalents)
  const [customFixedCost, setCustomFixedCost] = useState(190000); 
  const [customPrice, setCustomPrice] = useState(2300); 
  const [customVariableCost, setCustomVariableCost] = useState(1900); 
  
  const [activeBomIndex, setActiveBomIndex] = useState(null);
  const [hoveredYearIndex, setHoveredYearIndex] = useState(null);

  // Toggle Theme helper
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Add custom node function
  const handleAddNodeSubmit = (e) => {
    e.preventDefault();
    if (!newNodeName.trim() || !newNodeLocation.trim()) return;

    const nextId = nodeData.length;
    const newNode = {
      id: nextId,
      name: newNodeName.trim(),
      location: newNodeLocation.trim(),
      baselines: {
        moisture: parseFloat(newNodeMoisture),
        pH: parseFloat(newNodePh),
        temp: 28.5,
        humidity: 78.0
      },
      status: "Normal",
      notes: `User-defined node deployed in agricultural microclimates.`
    };

    setNodeData(prev => [...prev, newNode]);
    setActiveNode(nextId);
    setShowAddNodeModal(false);

    // Reset inputs
    setNewNodeName('');
    setNewNodeLocation('');
    setNewNodeMoisture(50);
    setNewNodePh(6.5);
  };

  // Telemetry simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const intervalTime = 3000 / simulationSpeed;
    const interval = setInterval(() => {
      let updatedMoisture = 0;
      let updatedPh = 0;

      setNodeData(prevData => {
        return prevData.map(node => {
          if (alertTrigger && node.id === activeNode) {
            let moisture = node.baselines.moisture;
            let pH = node.baselines.pH;
            let temp = node.baselines.temp;
            let humidity = node.baselines.humidity;
            let status = node.status;

            if (alertTrigger === 'dry') {
              moisture = Math.max(12, moisture - 6);
              status = "Soil Dry Alert";
            } else if (alertTrigger === 'acidic') {
              pH = Math.max(4.1, pH - 0.45);
              status = "Acidic Warning";
            } else if (alertTrigger === 'optimal') {
              moisture = 65;
              pH = 6.6;
              status = "Optimal";
            }
            
            const item = {
              ...node,
              baselines: {
                moisture: parseFloat(moisture.toFixed(1)),
                pH: parseFloat(pH.toFixed(2)),
                temp: parseFloat((temp + (Math.random() * 0.4 - 0.2)).toFixed(1)),
                humidity: parseFloat((humidity + (Math.random() * 0.8 - 0.4)).toFixed(1))
              },
              status
            };

            if (node.id === activeNode) {
              updatedMoisture = item.baselines.moisture;
              updatedPh = item.baselines.pH;
            }
            return item;
          }

          const fluctuation = () => Math.random() * 0.5 - 0.25;
          const phFluctuation = () => Math.random() * 0.04 - 0.02;
          
          let newMoisture = Math.min(100, Math.max(0, node.baselines.moisture + fluctuation() * 2.5));
          let newPh = Math.min(14, Math.max(0, node.baselines.pH + phFluctuation() * 2.2));
          let newTemp = Math.min(50, Math.max(10, node.baselines.temp + fluctuation() * 0.8));
          let newHumidity = Math.min(100, Math.max(20, node.baselines.humidity + fluctuation() * 2));
          
          let status = "Normal";
          if (newMoisture < 25) status = "Soil Dry Alert";
          else if (newPh < 5.5) status = "Acidic Warning";
          else if (newPh > 8.0) status = "Alkaline Warning";
          else if (newMoisture > 55 && newPh >= 6.0 && newPh <= 7.2) status = "Optimal";

          const item = {
            ...node,
            baselines: {
              moisture: parseFloat(newMoisture.toFixed(1)),
              pH: parseFloat(newPh.toFixed(2)),
              temp: parseFloat(newTemp.toFixed(1)),
              humidity: parseFloat(newHumidity.toFixed(1))
            },
            status
          };

          if (node.id === activeNode) {
            updatedMoisture = item.baselines.moisture;
            updatedPh = item.baselines.pH;
          }
          return item;
        });
      });

      // Append active node's telemetry into scrolling history line graph
      if (updatedMoisture && updatedPh) {
        setTelemetryHistory(prevHistory => {
          const nextHist = [...prevHistory, { moisture: updatedMoisture, pH: updatedPh }];
          if (nextHist.length > 10) nextHist.shift();
          return nextHist;
        });
      }

    }, intervalTime);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, alertTrigger, activeNode]);

  const currentSoil = useMemo(() => {
    return nodeData[activeNode] ? nodeData[activeNode].baselines : { moisture: 50, pH: 6.5, temp: 28, humidity: 80 };
  }, [nodeData, activeNode]);

  const currentNodeInfo = useMemo(() => {
    return nodeData[activeNode] ? nodeData[activeNode] : { id: 0, name: "N/A", location: "N/A", status: "N/A", notes: "" };
  }, [nodeData, activeNode]);

  // Dynamic Crop Compatibility scores calculated real-time
  const cropCompatibility = useMemo(() => {
    const { moisture, pH } = currentSoil;
    
    const calculateScore = (idealPhRange, idealMoistureRange) => {
      let phDiff = 0;
      if (pH < idealPhRange[0]) phDiff = idealPhRange[0] - pH;
      else if (pH > idealPhRange[1]) phDiff = pH - idealPhRange[1];

      let moistDiff = 0;
      if (moisture < idealMoistureRange[0]) moistDiff = idealMoistureRange[0] - moisture;
      else if (moisture > idealMoistureRange[1]) moistDiff = moisture - idealMoistureRange[1];

      const phPenalty = Math.min(50, phDiff * 25);
      const moistPenalty = Math.min(50, moistDiff * 1.5);
      const score = Math.max(0, Math.round(100 - phPenalty - moistPenalty));
      
      let status = "Low Suitability";
      let colorClass = "score-low";
      if (score > 80) {
        status = "Highly Compatible";
        colorClass = "score-high";
      } else if (score > 50) {
        status = "Moderately Stable";
        colorClass = "score-medium";
      }
      
      return { score, status, colorClass };
    };

    return [
      { name: "Paddy Rice", emoji: "🌾", spec: "Prefers wet, slightly acidic soil", ...calculateScore([5.5, 6.5], [60, 90]) },
      { name: "Beefsteak Tomato", emoji: "🍅", spec: "Prefers well-drained, neutral soil", ...calculateScore([6.0, 7.0], [45, 65]) },
      { name: "Napa Cabbage", emoji: "🥬", spec: "Prefers moist, cool, neutral soil", ...calculateScore([6.0, 7.5], [50, 75]) },
      { name: "Irish Potato", emoji: "🥔", spec: "Prefers loose, slightly acidic soil", ...calculateScore([5.0, 6.0], [40, 58]) }
    ];
  }, [currentSoil]);

  // Financial calculations
  const contributionMargin = useMemo(() => {
    return Math.max(1, customPrice - customVariableCost);
  }, [customPrice, customVariableCost]);

  const breakEvenUnits = useMemo(() => {
    return Math.round(customFixedCost / contributionMargin);
  }, [customFixedCost, contributionMargin]);

  // Dynamic SVG Break-Even Crossover Chart calculation path
  const breakEvenChartLines = useMemo(() => {
    const scaleX = (q) => 40 + (q / 1000) * 400;
    const scaleY = (v) => 160 - (v / 3000000) * 140;

    // Line 1: Total Cost (Fixed Cost + Variable Cost * Q)
    const costAtQ0 = customFixedCost;
    const costAtQ1000 = customFixedCost + (customVariableCost * 1000);
    const costPath = `M ${scaleX(0)} ${scaleY(costAtQ0)} L ${scaleX(1000)} ${scaleY(costAtQ1000)}`;

    // Line 2: Total Revenue (Price * Q)
    const revAtQ0 = 0;
    const revAtQ1000 = customPrice * 1000;
    const revPath = `M ${scaleX(0)} ${scaleY(revAtQ0)} L ${scaleX(1000)} ${scaleY(revAtQ1000)}`;

    // Crossover break-even point coordinates
    const intersectionQ = breakEvenUnits;
    const intersectionVal = breakEvenUnits * customPrice;
    
    const intX = Math.min(440, Math.max(40, scaleX(intersectionQ)));
    const intY = Math.min(160, Math.max(20, scaleY(intersectionVal)));

    return { costPath, revPath, intX, intY, intersectionQ, intersectionVal };
  }, [customFixedCost, customPrice, customVariableCost, breakEvenUnits]);

  // Rolling real-time line chart lines path calculation
  const scrollingLinePath = useMemo(() => {
    const pointsCount = telemetryHistory.length;
    if (pointsCount === 0) return { moistPath: "", phPath: "" };
    
    let moistPoints = [];
    let phPoints = [];
    
    telemetryHistory.forEach((pt, idx) => {
      const x = 30 + (idx / 9) * 420;
      const yMoist = 130 - (pt.moisture / 100) * 110;
      const yPh = 130 - (pt.pH / 14) * 110;
      
      moistPoints.push(`${x},${yMoist}`);
      phPoints.push(`${x},${yPh}`);
    });

    return {
      moistPath: `M ${moistPoints.join(' L ')}`,
      phPath: `M ${phPoints.join(' L ')}`
    };
  }, [telemetryHistory]);

  return (
    <div className={`dashboard-container ${theme}-theme`}>
      {/* Curved background glowing shapes */}
      <div className="theme-glow-dot-1"></div>
      <div className="theme-glow-dot-2"></div>

      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <div className="logo-icon">TS</div>
            <div className="logo-text">TerraScan</div>
          </div>
          
          <nav className="sidebar-menu">
            <li 
              className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
              Overview
            </li>
            <li 
              className={`menu-item ${activeTab === 'telemetry' ? 'active' : ''}`}
              onClick={() => setActiveTab('telemetry')}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
              </svg>
              Soil Intelligence
            </li>
            <li 
              className={`menu-item ${activeTab === 'financials' ? 'active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5 8.25 9m0 0 4.5 4.5M8.25 9l4.5-4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Feasibility Model
            </li>
            <li 
              className={`menu-item ${activeTab === 'variants' ? 'active' : ''}`}
              onClick={() => setActiveTab('variants')}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128c.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              Hardware &amp; BOM
            </li>
            <li 
              className={`menu-item ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.97 5.97 0 0 0-.75-2.985m-.058-2.054a3.75 3.75 0 1 0-1.825-4.4a3.861 3.861 0 0 0 .025.455M12 7.5a.6.6 0 0 1 .6-.6h3a.6.6 0 0 1 .6.6v3a.6.6 0 0 1-.6.6h-3a.6.6 0 0 1-.6-.6v-3ZM6 18.72a9.094 9.094 0 0 1-3.741-.479 3 3 0 0 1 4.682-2.72m-.94 3.198.002.031c0 .225.012.447.037.666A11.944 11.944 0 0 0 12 21c2.17 0 4.207-.576 5.963-1.584A6.06 6.06 0 0 0 18 18.72m-12 0a5.97 5.97 0 0 1 .75-2.985m.058-2.054a3.75 3.75 0 1 1 1.825-4.4a3.86 3.86 0 0 1-.025.455M12 7.5a.6.6 0 0 0-.6-.6H8.4a.6.6 0 0 0-.6.6v3a.6.6 0 0 0,.6.6h3a.6.6 0 0 0,.6-.6v-3Z" />
              </svg>
              Governance &amp; Org
            </li>
          </nav>
        </div>

        <div className="sidebar-footer">
          {/* Interactive Light/Dark Mode Switcher */}
          <div className="theme-toggle-row">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="4" stroke="currentColor"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M16.24 16.24l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeLinecap="round"/>
                  </svg>
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>

          <div className="tup-tag">
            <div className="tup-logo-dot"></div>
            <span>TUP Manila • BSECE 3B</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        
        <div>
          {/* Header Title block */}
          <header className="dashboard-header">
            <div className="header-title">
              {activeTab === 'overview' && (
                <>
                  <h1>Platform Command Overview</h1>
                  <p>Real-time telemetry feeds and startup viability trackers at a glance.</p>
                </>
              )}
              {activeTab === 'telemetry' && (
                <>
                  <h1>Soil Intelligence Matrix</h1>
                  <p>ESP32 active field diagnostics node telemetry and rolling historical charts.</p>
                </>
              )}
              {activeTab === 'financials' && (
                <>
                  <h1>Feasibility Study &amp; Projections</h1>
                  <p>Five-year growth projections, variable costing BOM ring, and crossover break-even line chart.</p>
                </>
              )}
              {activeTab === 'variants' && (
                <>
                  <h1>Hardware Product Line Variants</h1>
                  <p>Rugged handheld, modular smart field nodes, and exposed educational systems.</p>
                </>
              )}
              {activeTab === 'team' && (
                <>
                  <h1>Governance &amp; Corporate Execution Plan</h1>
                  <p>Organizational tree, core executive leadership, and pre-operating roadmap.</p>
                </>
              )}
            </div>

            <div className="header-controls">
              {activeTab === 'telemetry' && (
                <>
                  <button 
                    className={`btn-secondary ${isSimulating ? 'active' : ''}`}
                    onClick={() => setIsSimulating(!isSimulating)}
                  >
                    {isSimulating ? "⏸ Pause" : "▶ Resume"}
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => {
                      setAlertTrigger('optimal');
                      setTimeout(() => setAlertTrigger(null), 1000);
                    }}
                  >
                    ⚡ Calibrate
                  </button>
                </>
              )}
              {activeTab === 'financials' && (
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setCustomFixedCost(190000);
                    setCustomPrice(2300);
                    setCustomVariableCost(1900);
                  }}
                >
                  Reset Parameters
                </button>
              )}
              
              {/* Option to Add Field Nodes directly into the UI */}
              <button 
                className="btn-primary"
                onClick={() => setShowAddNodeModal(true)}
                style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', boxShadow: '0 4px 12px var(--accent-purple-glow)' }}
              >
                ＋ Add Field Node
              </button>
            </div>
          </header>

          {/* -------------------- OVERVIEW TAB -------------------- */}
          {activeTab === 'overview' && (
            <div className="tab-view-fade">
              
              {/* Quick KPI Stat Cards */}
              <div className="stats-grid">
                <div className="glass-card accent-green">
                  <div className="stat-header">
                    <span className="stat-title">Active Devices</span>
                    <div className="stat-icon" style={{color: 'var(--accent-green)'}}>📡</div>
                  </div>
                  <div className="stat-value">{nodeData.length} Nodes</div>
                  <div className="stat-sub">
                    <span className="trend-up">100% Online</span> stable signal links
                  </div>
                </div>

                <div className="glass-card accent-purple">
                  <div className="stat-header">
                    <span className="stat-title">Soil Moisture</span>
                    <div className="stat-icon" style={{color: 'var(--accent-purple)'}}>💧</div>
                  </div>
                  <div className="stat-value">{currentSoil.moisture}%</div>
                  <div className="stat-sub">
                    Selected Node: <span className="trend-up">{currentNodeInfo.name}</span>
                  </div>
                </div>

                <div className="glass-card accent-blue">
                  <div className="stat-header">
                    <span className="stat-title">Gross Sales (Y1)</span>
                    <div className="stat-icon" style={{color: 'var(--accent-blue)'}}>📈</div>
                  </div>
                  <div className="stat-value">PHP 15.52M</div>
                  <div className="stat-sub">
                    Selling Price: <span className="trend-up">PHP 2,300.00</span>
                  </div>
                </div>

                <div className="glass-card accent-green">
                  <div className="stat-header">
                    <span className="stat-title">Break-Even Point</span>
                    <div className="stat-icon" style={{color: 'var(--accent-green)'}}>⚖️</div>
                  </div>
                  <div className="stat-value">{breakEvenUnits} u/mo</div>
                  <div className="stat-sub">
                    Margin Contribution: <span className="trend-up">PHP {contributionMargin}</span>
                  </div>
                </div>
              </div>

              {/* Split layout: Overview Station + Quick Financials */}
              <div className="soil-dashboard-layout">
                
                {/* Map & Sensor Overview */}
                <div className="glass-card" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Active Field Nodes Selector</h2>
                  
                  <div className="selector-bar">
                    {nodeData.map(node => (
                      <button
                        key={node.id}
                        className={`selector-btn ${activeNode === node.id ? 'active' : ''}`}
                        onClick={() => setActiveNode(node.id)}
                      >
                        {node.name}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '145%', marginBottom: '12px' }}>
                        <strong>Active Location:</strong> {currentNodeInfo.location}<br />
                        <strong>Device Status:</strong> <span className={`gauge-status ${currentNodeInfo.status.includes('Alert') || currentNodeInfo.status.includes('Warning') ? 'status-alert' : 'status-optimal'}`} style={{ padding: '1px 6px', fontSize: '9.5px', marginLeft: '6px' }}>{currentNodeInfo.status}</span><br />
                        <strong>Node Deployment:</strong> {currentNodeInfo.notes}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                        <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: '700' }}>Moisture</span>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '2px' }}>{currentSoil.moisture}%</div>
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-dark)', textTransform: 'uppercase', fontWeight: '700' }}>Soil pH</span>
                          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-purple)', marginTop: '2px' }}>{currentSoil.pH}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'relative', width: '100%', height: '125px', background: 'var(--bg-input)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ zIndex: '2', textAlign: 'center' }}>
                        <div style={{ fontSize: '20px' }}>📡</div>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', display: 'block', marginTop: '4px' }}>ESP32 Wi-Fi Mode</span>
                        <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Signal Stable</span>
                      </div>
                      <div style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-green-glow)', filter: 'blur(24px)', top: '10px', left: '20px' }}></div>
                      <div style={{ position: 'absolute', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-purple-glow)', filter: 'blur(24px)', bottom: '10px', right: '20px' }}></div>
                    </div>
                  </div>

                  <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn-primary" onClick={() => setActiveTab('telemetry')}>
                      Open Soil Matrix →
                    </button>
                  </div>
                </div>

                {/* Quick Financial Overview */}
                <div className="glass-card" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Feasibility Core Metrics</h2>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '140%', marginBottom: '12px' }}>
                    TerraScan pricing cuts down import equipment costs by half, securing highly lucrative operating yields for smallholders.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '600' }}>Production Unit Cost</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--text-main)' }}>PHP 1,900.00</span>
                    </div>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '600' }}>Selling Price</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--accent-green)' }}>PHP 2,300.00</span>
                    </div>
                    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: '600' }}>Net Profit (Year 1)</span>
                      <span style={{ fontSize: '11.5px', fontWeight: '800', color: 'var(--accent-purple)' }}>PHP 336,000.00</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button className="btn-secondary" style={{ flexGrow: 1 }} onClick={() => setActiveTab('variants')}>
                      Hardware
                    </button>
                    <button className="btn-primary" style={{ flexGrow: 1 }} onClick={() => setActiveTab('financials')}>
                      Projections
                    </button>
                  </div>
                </div>
              </div>

              {/* Core Values / Vision Panel */}
              <div className="glass-card" style={{ marginTop: '24px', textAlign: 'left' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Platform Engineering Core Values</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--accent-green)', marginBottom: '4px' }}>✓ Precision Diagnostics</h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '140%' }}>
                      Replacing guesswork with spatial and electrical soil analytics.
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--accent-purple)', marginBottom: '4px' }}>✓ Eco Sustainability</h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '140%' }}>
                      Preventing soil nutrient depletion through smart diagnostic schedules.
                    </p>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13.5px', fontWeight: '750', color: 'var(--accent-blue)', marginBottom: '4px' }}>✓ Financial Viability</h3>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '140%' }}>
                      Boosting smallholder crop revenue while trimming initial tech capital.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* -------------------- SOIL INTELLIGENCE TAB -------------------- */}
          {activeTab === 'telemetry' && (
            <div className="tab-view-fade">
              
              {/* Active Station selector tab */}
              <div className="selector-bar">
                {nodeData.map(node => (
                  <button
                    key={node.id}
                    className={`selector-btn ${activeNode === node.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveNode(node.id);
                      setAlertTrigger(null); 
                    }}
                  >
                    {node.name} ({node.location})
                  </button>
                ))}
              </div>

              <div className="soil-dashboard-layout">
                
                {/* Telemetry Visualizers */}
                <div className="left-panel">
                  <div className="glass-card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Real-Time Diagnostics Gauges</h2>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isSimulating ? 'var(--accent-green)' : 'var(--alert-orange)', display: 'inline-block' }}></span>
                        {isSimulating ? "Live ESP32 Feed" : "Diagnostics Paused"}
                      </span>
                    </div>

                    <div className="telemetry-grid">
                      
                      {/* Soil Moisture */}
                      <div className="gauge-container">
                        <div className="gauge-svg-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="6" />
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent-green-glow)" strokeWidth="10" strokeDasharray="131 263" strokeDashoffset="-78" />
                            <circle 
                              cx="50" cy="50" r="42" fill="none" 
                              stroke="var(--accent-green)" strokeWidth="7" 
                              strokeLinecap="round"
                              strokeDasharray="263"
                              strokeDashoffset={263 - (263 * currentSoil.moisture) / 100}
                              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                            />
                          </svg>
                          <div className="gauge-center-val">
                            <span className="gauge-num">{currentSoil.moisture}</span>
                            <span className="gauge-unit">%</span>
                          </div>
                        </div>
                        <span className="gauge-title">Soil Moisture</span>
                        <span className={`gauge-status ${currentSoil.moisture < 25 ? 'status-alert' : currentSoil.moisture > 80 ? 'status-warning' : 'status-optimal'}`}>
                          {currentSoil.moisture < 25 ? "Dry" : currentSoil.moisture > 80 ? "Saturated" : "Optimal"}
                        </span>
                      </div>

                      {/* Soil pH */}
                      <div className="gauge-container">
                        <div className="gauge-svg-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="6" />
                            <circle 
                              cx="50" cy="50" r="42" fill="none" 
                              stroke="var(--accent-purple)" strokeWidth="7" 
                              strokeLinecap="round"
                              strokeDasharray="263"
                              strokeDashoffset={263 - (263 * currentSoil.pH) / 14}
                              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                            />
                          </svg>
                          <div className="gauge-center-val">
                            <span className="gauge-num">{currentSoil.pH}</span>
                            <span className="gauge-unit">pH</span>
                          </div>
                        </div>
                        <span className="gauge-title">Soil Acidity</span>
                        <span className={`gauge-status ${currentSoil.pH < 5.5 ? 'status-alert' : currentSoil.pH > 7.5 ? 'status-warning' : 'status-optimal'}`}>
                          {currentSoil.pH < 5.5 ? "Acidic" : currentSoil.pH > 7.5 ? "Alkaline" : "Neutral"}
                        </span>
                      </div>

                      {/* Temperature */}
                      <div className="gauge-container">
                        <div className="gauge-svg-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="6" />
                            <circle 
                              cx="50" cy="50" r="42" fill="none" 
                              stroke="var(--accent-blue)" strokeWidth="7" 
                              strokeLinecap="round"
                              strokeDasharray="263"
                              strokeDashoffset={263 - (263 * currentSoil.temp) / 50}
                              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                            />
                          </svg>
                          <div className="gauge-center-val">
                            <span className="gauge-num">{currentSoil.temp}</span>
                            <span className="gauge-unit">°C</span>
                          </div>
                        </div>
                        <span className="gauge-title">Soil Temp</span>
                        <span className="gauge-status status-optimal">Stable</span>
                      </div>

                      {/* Atmospheric Humidity */}
                      <div className="gauge-container">
                        <div className="gauge-svg-wrap">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--bg-input)" strokeWidth="6" />
                            <circle 
                              cx="50" cy="50" r="42" fill="none" 
                              stroke="var(--alert-orange)" strokeWidth="7" 
                              strokeLinecap="round"
                              strokeDasharray="263"
                              strokeDashoffset={263 - (263 * currentSoil.humidity) / 100}
                              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                            />
                          </svg>
                          <div className="gauge-center-val">
                            <span className="gauge-num">{currentSoil.humidity}</span>
                            <span className="gauge-unit">% RH</span>
                          </div>
                        </div>
                        <span className="gauge-title">Air Humidity</span>
                        <span className="gauge-status status-optimal">DHT11 Link</span>
                      </div>

                    </div>
                  </div>

                  {/* Scrolling Line graph */}
                  <div className="glass-card chart-realtime-card" style={{ textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Rolling Telemetry History</h2>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Displays last 10 stabilized readings</span>
                      </div>
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-color" style={{ background: 'var(--accent-green)' }}></span>
                          <span>Moisture</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{ background: 'var(--accent-purple)' }}></span>
                          <span>pH</span>
                        </div>
                      </div>
                    </div>

                    <div className="realtime-chart-svg">
                      <svg viewBox="0 0 480 140" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <line x1="30" y1="130" x2="450" y2="130" stroke="var(--chart-axis)" strokeWidth="1" />
                        <line x1="30" y1="70" x2="450" y2="70" stroke="var(--chart-grid)" strokeWidth="1" />
                        <line x1="30" y1="10" x2="450" y2="10" stroke="var(--chart-grid)" strokeWidth="1" />
                        
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                          <line key={i} x1={30 + i * 46.6} y1="10" x2={30 + i * 46.6} y2="130" stroke="var(--chart-grid)" strokeWidth="0.5" />
                        ))}

                        <path d={scrollingLinePath.moistPath} fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.3s ease' }} />
                        <path d={scrollingLinePath.phPath} fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'd 0.3s ease' }} />
                        
                        {telemetryHistory.length > 0 && (
                          <>
                            <circle cx={30 + (telemetryHistory.length - 1) * 46.6} cy={130 - (telemetryHistory[telemetryHistory.length - 1].moisture / 100) * 110} r="4" fill="var(--accent-green)" />
                            <circle cx={30 + (telemetryHistory.length - 1) * 46.6} cy={130 - (telemetryHistory[telemetryHistory.length - 1].pH / 14) * 110} r="4" fill="var(--accent-purple)" />
                          </>
                        )}
                      </svg>
                    </div>
                  </div>

                </div>

                {/* Telemetry Control Panel */}
                <div className="control-panel">
                  
                  {/* Crop Recommendation Engine */}
                  <div className="glass-card crop-card">
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Crop Compatibility Engine</h2>
                    
                    <div className="crop-list">
                      {cropCompatibility.map(crop => (
                        <div key={crop.name} className="crop-item">
                          <div className="crop-info">
                            <div className="crop-avatar" style={{ background: crop.score > 80 ? 'var(--accent-green-glow)' : crop.score > 50 ? 'var(--accent-purple-glow)' : 'var(--alert-red-glow)' }}>
                              {crop.emoji}
                            </div>
                            <div>
                              <div className="crop-name">{crop.name}</div>
                              <div className="crop-suitability">{crop.spec}</div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span className={`suitability-score ${crop.colorClass}`}>{crop.score}%</span>
                            <div style={{ fontSize: '8.5px', color: 'var(--text-dark)', fontWeight: '700', textTransform: 'uppercase' }}>{crop.status.split(' ')[0]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation Control Console */}
                  <div className="glass-card simulation-console">
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Stresses Injector Console</h2>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '140%' }}>
                      Simulate manual environmental events to analyze warning responses instantly.
                    </p>

                    <div className="console-row">
                      <div>
                        <div className="console-label">Active Simulation Loops</div>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          checked={isSimulating}
                          onChange={(e) => setIsSimulating(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="console-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div className="console-label">Fluctuation Speed</div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: '700' }}>{simulationSpeed}x</div>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="4" 
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                        className="slider-control"
                      />
                    </div>

                    <div className="console-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px', borderBottom: 'none' }}>
                      <div className="console-label">Inject Environmental Stressors</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                        <button 
                          className={`btn-secondary ${alertTrigger === 'dry' ? 'active' : ''}`}
                          style={{ fontSize: '10.5px', padding: '6px 10px' }}
                          onClick={() => setAlertTrigger(alertTrigger === 'dry' ? null : 'dry')}
                        >
                          🔥 Dry Soil
                        </button>
                        <button 
                          className={`btn-secondary ${alertTrigger === 'acidic' ? 'active' : ''}`}
                          style={{ fontSize: '10.5px', padding: '6px 10px' }}
                          onClick={() => setAlertTrigger(alertTrigger === 'acidic' ? null : 'acidic')}
                        >
                          ⚠️ Acidic Rain
                        </button>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

          {/* -------------------- FINANCIALS TAB -------------------- */}
          {activeTab === 'financials' && (
            <div className="tab-view-fade">
              
              <div className="financial-layout">
                
                {/* Financial growth projections */}
                <div className="left-panel">
                  <div className="glass-card chart-card">
                    <div className="chart-header">
                      <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>5-Year Growth Projections</h2>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Interactive baseline modeling (Gross Revenue vs post-tax profits)</span>
                      </div>
                      
                      <div className="chart-legend">
                        <div className="legend-item">
                          <span className="legend-color" style={{ background: 'var(--accent-green)' }}></span>
                          <span>Gross</span>
                        </div>
                        <div className="legend-item">
                          <span className="legend-color" style={{ background: 'var(--accent-purple)' }}></span>
                          <span>Post-Tax Net</span>
                        </div>
                      </div>
                    </div>

                    <div className="svg-chart-container">
                      <svg viewBox="0 0 500 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <line x1="40" y1="20" x2="480" y2="20" stroke="var(--chart-grid)" strokeWidth="1" />
                        <line x1="40" y1="70" x2="480" y2="70" stroke="var(--chart-grid)" strokeWidth="1" />
                        <line x1="40" y1="120" x2="480" y2="120" stroke="var(--chart-grid)" strokeWidth="1" />
                        <line x1="40" y1="170" x2="480" y2="170" stroke="var(--chart-grid)" strokeWidth="1" />
                        <line x1="40" y1="200" x2="480" y2="200" stroke="var(--chart-axis)" strokeWidth="1" />
                        
                        {FINANCIAL_PROJECTIONS.map((p, idx) => {
                          const x = 60 + idx * 95;
                          const barHeight = (p.revenue / 24000000) * 170;
                          const y = 200 - barHeight;
                          
                          return (
                            <g key={`bar-${idx}`} 
                               onMouseEnter={() => setHoveredYearIndex(idx)}
                               onMouseLeave={() => setHoveredYearIndex(null)}
                               style={{ cursor: 'pointer' }}
                            >
                              <rect 
                                x={x - 15} 
                                y={y} 
                                width="30" 
                                height={barHeight} 
                                rx="4" 
                                fill={hoveredYearIndex === idx ? 'var(--accent-green)' : 'var(--accent-green-glow)'}
                                stroke={hoveredYearIndex === idx ? 'var(--accent-green)' : 'rgba(16, 185, 129, 0.2)'}
                                strokeWidth="1"
                                style={{ transition: 'all 0.3s ease' }}
                              />
                              <text x={x} y="215" fill="var(--text-muted)" fontSize="9.5" textAnchor="middle" fontWeight="700">
                                {p.year}
                              </text>
                            </g>
                          );
                        })}

                        <path d="M 60 197 L 155 193 L 250 187 L 345 186 L 440 185" fill="none" stroke="var(--accent-purple)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                        {FINANCIAL_PROJECTIONS.map((p, idx) => {
                          const x = 60 + idx * 95;
                          const profitYPoints = [197, 193, 187, 186, 185];
                          const y = profitYPoints[idx];

                          return (
                            <circle 
                              key={`dot-${idx}`}
                              cx={x} 
                              cy={y} 
                              r="5" 
                              fill={theme === 'dark' ? '#161e2e' : '#fff'} 
                              stroke="var(--accent-purple)" 
                              strokeWidth="2.5"
                              onMouseEnter={() => setHoveredYearIndex(idx)}
                              onMouseLeave={() => setHoveredYearIndex(null)}
                              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            />
                          );
                        })}
                      </svg>

                      {hoveredYearIndex !== null && (
                        <div className="chart-bar-hover-info">
                          <strong>{FINANCIAL_PROJECTIONS[hoveredYearIndex].year}:</strong> Revenue: <span style={{ color: 'var(--accent-green)', fontWeight: '800' }}>PHP {(FINANCIAL_PROJECTIONS[hoveredYearIndex].revenue / 1000000).toFixed(2)}M</span> • Profit: <span style={{ color: 'var(--accent-purple)', fontWeight: '800' }}>PHP {(FINANCIAL_PROJECTIONS[hoveredYearIndex].profit / 1000).toFixed(0)}k</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statement metrics */}
                  <div className="glass-card projection-table-card">
                    <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '12px', color: 'var(--text-main)' }}>Economic Statement Matrix</h2>
                    
                    <div className="table-wrapper">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Year 1</th>
                            <th>Year 2</th>
                            <th>Year 3</th>
                            <th>Year 4</th>
                            <th>Year 5</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Gross Sales (PHP)</td>
                            <td>15,525,000</td>
                            <td>18,292,860</td>
                            <td>21,253,300</td>
                            <td>22,103,432</td>
                            <td>22,987,569</td>
                          </tr>
                          <tr>
                            <td>Variable COGS</td>
                            <td>12,825,000</td>
                            <td>15,134,700</td>
                            <td>17,543,600</td>
                            <td>18,245,344</td>
                            <td>18,975,158</td>
                          </tr>
                          <tr>
                            <td>Fixed Operating Costs</td>
                            <td>2,280,000</td>
                            <td>2,368,800</td>
                            <td>2,461,152</td>
                            <td>2,557,199</td>
                            <td>2,657,087</td>
                          </tr>
                          <tr className="highlight-row">
                            <td>Post-Tax Net Profit</td>
                            <td>336,000</td>
                            <td>631,488</td>
                            <td>998,838</td>
                            <td>1,040,711</td>
                            <td>1,084,259</td>
                          </tr>
                          <tr>
                            <td>Net Profit Margin</td>
                            <td>1.94%</td>
                            <td>3.25%</td>
                            <td>4.52%</td>
                            <td>4.52%</td>
                            <td>4.53%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Financial Modeling Tools Panel */}
                <div className="control-panel">
                  
                  {/* Break-Even Simulator */}
                  <div className="glass-card calc-wrapper">
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Break-Even Simulator</h2>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '140%' }}>
                      Tweak parameters to visually shifts crossover cost metrics.
                    </p>

                    <div className="calc-kpi-row">
                      <div className="calc-kpi-card">
                        <div className="calc-kpi-label">Variable Cost</div>
                        <div className="calc-kpi-val" style={{ color: 'var(--accent-purple)' }}>PHP {customVariableCost}</div>
                      </div>
                      <div className="calc-kpi-card">
                        <div className="calc-kpi-label">Unit Price</div>
                        <div className="calc-kpi-val" style={{ color: 'var(--accent-blue)' }}>PHP {customPrice}</div>
                      </div>
                    </div>

                    <div className="console-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div className="console-label">Monthly Fixed Operating</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '800' }}>PHP {customFixedCost.toLocaleString()}</div>
                      </div>
                      <input 
                        type="range" 
                        min="100000" 
                        max="350000" 
                        step="5000"
                        value={customFixedCost}
                        onChange={(e) => setCustomFixedCost(parseInt(e.target.value))}
                        className="slider-control"
                      />
                    </div>

                    <div className="console-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <div className="console-label">Unit Price (P)</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '800' }}>PHP {customPrice.toLocaleString()}</div>
                      </div>
                      <input 
                        type="range" 
                        min="2000" 
                        max="3500" 
                        step="50"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(parseInt(e.target.value))}
                        className="slider-control"
                      />
                    </div>

                    <div className="breakeven-result-card">
                      <div className="breakeven-title">Required Break-Even Quantity</div>
                      <div className="breakeven-value">{breakEvenUnits} units/month</div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        CM: <strong>PHP {contributionMargin}</strong> per unit sold.
                      </span>
                    </div>

                    {/* Crossover Line Graph */}
                    <div className="breakeven-visual-chart">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '750', color: 'var(--accent-blue)' }}>Total Revenue</span>
                        <span style={{ fontWeight: '750', color: 'var(--accent-purple)' }}>Total Costs</span>
                      </div>
                      <svg viewBox="0 0 460 180" width="100%" height="100%" style={{ overflow: 'visible' }}>
                        <line x1="40" y1="160" x2="440" y2="160" stroke="var(--chart-axis)" strokeWidth="1" />
                        <line x1="40" y1="20" x2="40" y2="160" stroke="var(--chart-axis)" strokeWidth="1" />
                        <line x1="40" y1="90" x2="440" y2="90" stroke="var(--chart-grid)" strokeWidth="0.5" />

                        <path d={breakEvenChartLines.costPath} fill="none" stroke="var(--accent-purple)" strokeWidth="2.5" />
                        <path d={breakEvenChartLines.revPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" />

                        <circle cx={breakEvenChartLines.intX} cy={breakEvenChartLines.intY} r="5" fill="var(--accent-green)" stroke="#fff" strokeWidth="2.5" />
                        
                        <text x={breakEvenChartLines.intX} y={Math.max(15, breakEvenChartLines.intY - 10)} fill="var(--accent-green)" fontSize="9" textAnchor="middle" fontWeight="800">
                          {breakEvenChartLines.intersectionQ} units
                        </text>
                      </svg>
                    </div>
                  </div>

                  {/* Cost Explorer */}
                  <div className="glass-card bom-card">
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.02em' }}>BOM Variable costing</h2>
                    <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      TUP's <strong>PHP 1,900.00</strong> variable bill of materials.
                    </p>

                    <div className="bom-layout">
                      <div className="bom-chart-wrapper">
                        <svg width="100" height="100" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="24 76" strokeDashoffset="100" 
                                  style={{ opacity: activeBomIndex === null || activeBomIndex === 0 ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.2s ease' }}
                                  onMouseEnter={() => setActiveBomIndex(0)} onMouseLeave={() => setActiveBomIndex(null)}
                          />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="15 85" strokeDashoffset="76"
                                  style={{ opacity: activeBomIndex === null || activeBomIndex === 1 ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.2s ease' }}
                                  onMouseEnter={() => setActiveBomIndex(1)} onMouseLeave={() => setActiveBomIndex(null)}
                          />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="9 91" strokeDashoffset="61"
                                  style={{ opacity: activeBomIndex === null || activeBomIndex === 2 ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.2s ease' }}
                                  onMouseEnter={() => setActiveBomIndex(2)} onMouseLeave={() => setActiveBomIndex(null)}
                          />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="#eab308" strokeWidth="4" strokeDasharray="7 93" strokeDashoffset="52"
                                  style={{ opacity: activeBomIndex === null || activeBomIndex === 3 ? 1 : 0.4, cursor: 'pointer', transition: 'all 0.2s ease' }}
                                  onMouseEnter={() => setActiveBomIndex(3)} onMouseLeave={() => setActiveBomIndex(null)}
                          />
                          <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" strokeDasharray="45 55" strokeDashoffset="45"
                                  style={{ opacity: activeBomIndex === null || activeBomIndex >= 4 ? 1 : 0.4, transition: 'all 0.2s ease' }}
                          />
                        </svg>
                        <div className="bom-chart-center">
                          <div className="bom-total-lbl">Total</div>
                          <div className="bom-total-val">PHP 1.9k</div>
                        </div>
                      </div>

                      <div className="bom-list">
                        {BILL_OF_MATERIALS.slice(0, 4).map((item, idx) => (
                          <div 
                            key={item.name} 
                            className={`bom-item ${activeBomIndex === idx ? 'active' : ''}`}
                            onMouseEnter={() => setActiveBomIndex(idx)}
                            onMouseLeave={() => setActiveBomIndex(null)}
                          >
                            <div className="bom-item-name">
                              <span className="bom-dot" style={{ background: item.color }}></span>
                              <span>{item.name.replace("Analog ", "").replace("Industrial ", "").substring(0, 14)}</span>
                            </div>
                            <span className="bom-item-val">PHP {item.cost}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeBomIndex !== null && (
                      <div style={{ marginTop: '10px', padding: '8px', background: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border-glass)', fontSize: '11px', lineHeight: '140%', color: 'var(--text-muted)' }}>
                        <strong>{BILL_OF_MATERIALS[activeBomIndex].name}:</strong> {BILL_OF_MATERIALS[activeBomIndex].desc}
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* -------------------- VARIANTS TAB -------------------- */}
          {activeTab === 'variants' && (
            <div className="tab-view-fade product-variants-section">
              <div className="product-row">
                
                {/* Variant 1 */}
                <div className="glass-card product-card">
                  <div>
                    <div className="product-img-wrap">
                      <span className="product-tag-overlay">Primary Market</span>
                      <div className="variant-icon-bg" style={{ color: 'var(--accent-green)' }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="product-info-block">
                      <h3 className="product-name-heading">Handheld Diagnostics</h3>
                      <p className="product-desc-text">
                        Rugged diagnostic device providing instantaneous localized soil acidity, moisture, and microclimate parameter readouts on physical I2C LCD screens.
                      </p>
                      
                      <ul className="product-specs-list">
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Direct plug-and-play operations</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Molded ABS weatherproof shell</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Localized physical screen display</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <div>
                      <span className="product-price-lbl">Retail Price</span>
                      <div className="product-price-val">PHP 2,300.00</div>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--accent-green)', fontWeight: '700' }}>Operational</span>
                  </div>
                </div>

                {/* Variant 2 */}
                <div className="glass-card product-card">
                  <div>
                    <div className="product-img-wrap">
                      <span className="product-tag-overlay" style={{ color: 'var(--accent-purple)' }}>Urban Techs</span>
                      <div className="variant-icon-bg" style={{ color: 'var(--accent-purple)' }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="product-info-block">
                      <h3 className="product-name-heading">Smart Field Node</h3>
                      <p className="product-desc-text">
                        A modular standalone hardware bundle allowing vertical growers to deploy localized spatial networks powered by ESP32 microcontrollers.
                      </p>
                      
                      <ul className="product-specs-list">
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>ESP32 processor core with Wi-Fi</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Supports spatial central staging</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Discrete long-lead probes</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <div>
                      <span className="product-price-lbl">DIY Kit Cost</span>
                      <div className="product-price-val" style={{ color: 'var(--accent-purple)' }}>PHP 1,750.00</div>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--accent-purple)', fontWeight: '700' }}>In stock</span>
                  </div>
                </div>

                {/* Variant 3 */}
                <div className="glass-card product-card">
                  <div>
                    <div className="product-img-wrap">
                      <span className="product-tag-overlay" style={{ color: 'var(--accent-blue)' }}>Academic Labs</span>
                      <div className="variant-icon-bg" style={{ color: 'var(--accent-blue)' }}>
                        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9h18M3 12h18M3 15h18M3 18h18M3 6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75V21H3V6.75Z" />
                        </svg>
                      </div>
                    </div>
                    
                    <div className="product-info-block">
                      <h3 className="product-name-heading">Educational Testbed</h3>
                      <p className="product-desc-text">
                        A specialized open structure teaching model built with physical test pins and clear panels, ideal for engineering departments and laboratories.
                      </p>
                      
                      <ul className="product-specs-list">
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Exposed diagnostic test points</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Plexiglass transparent enclosure</span>
                        </li>
                        <li>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Pre-loaded noise filters firmware</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <div>
                      <span className="product-price-lbl">Academic Price</span>
                      <div className="product-price-val" style={{ color: 'var(--accent-blue)' }}>PHP 3,500.00</div>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--accent-blue)', fontWeight: '700' }}>Custom build</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* -------------------- TEAM & GOVERNANCE TAB -------------------- */}
          {activeTab === 'team' && (
            <div className="tab-view-fade org-chart-wrapper">
              
              <div className="glass-card" style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Corporate Execution Tree</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
                  Project originators dividing strategic engineering and operational governance channels.
                </p>

                <div className="org-chart-tree">
                  <div className="org-level">
                    <div className="org-node level-ceo">
                      <div className="org-avatar-circle">DV</div>
                      <div className="org-role-lbl">CEO</div>
                      <div className="org-name-lbl">Daphne Grace Villaralvo</div>
                      <div className="org-desc-lbl">Strategic corporate direction.</div>
                    </div>
                  </div>

                  <div className="org-level" style={{ flexWrap: 'wrap' }}>
                    <div className="org-node level-c-suite">
                      <div className="org-avatar-circle" style={{ background: 'var(--accent-blue)' }}>JE</div>
                      <div className="org-role-lbl" style={{ color: 'var(--accent-blue)' }}>CTO</div>
                      <div className="org-name-lbl">John Michael Estrada</div>
                      <div className="org-desc-lbl">Firmware &amp; circuit systems.</div>
                    </div>

                    <div className="org-node level-c-suite">
                      <div className="org-avatar-circle" style={{ background: 'var(--accent-purple)' }}>AM</div>
                      <div className="org-role-lbl" style={{ color: 'var(--accent-purple)' }}>COO</div>
                      <div className="org-name-lbl">Allen Marx Monilar</div>
                      <div className="org-desc-lbl">Stress-testing &amp; assembly.</div>
                    </div>

                    <div className="org-node level-c-suite">
                      <div className="org-avatar-circle" style={{ background: 'var(--alert-orange)' }}>DM</div>
                      <div className="org-role-lbl" style={{ color: 'var(--alert-orange)' }}>CFO</div>
                      <div className="org-name-lbl">Danica Madera</div>
                      <div className="org-desc-lbl">Procurement &amp; budgets.</div>
                    </div>

                    <div className="org-node level-c-suite">
                      <div className="org-avatar-circle" style={{ background: '#ec4899' }}>JC</div>
                      <div className="org-role-lbl" style={{ color: '#ec4899' }}>CMO</div>
                      <div className="org-name-lbl">J. Castro &amp; T. Marcelino</div>
                      <div className="org-desc-lbl">Outreach &amp; agricultural links.</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Implementation Timeline */}
              <div className="glass-card timeline-card">
                <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Project Rollout Roadmap</h2>

                <div className="timeline-list">
                  <div className="timeline-node">
                    <div className="timeline-time">Month 1</div>
                    <div className="timeline-info">
                      <div className="timeline-heading">Schematics Finalization &amp; Grants</div>
                      <div className="timeline-body">Coordinate final engineering layouts. Secure baseline funding via institutional research grants.</div>
                    </div>
                  </div>

                  <div className="timeline-node">
                    <div className="timeline-time">Month 2-3</div>
                    <div className="timeline-info">
                      <div className="timeline-heading">Workbench &amp; Testing Lab Setup</div>
                      <div className="timeline-body">Procure professional multimeters, chemical buffer calibration liquids, and structural enclosures.</div>
                    </div>
                  </div>

                  <div className="timeline-node">
                    <div className="timeline-time">Month 4-5</div>
                    <div className="timeline-info">
                      <div className="timeline-heading">Firmware &amp; Software Staging</div>
                      <div className="timeline-body">Flash diagnostic sensor logic on ESP32 controllers. Prototypes Wi-Fi packet integration.</div>
                    </div>
                  </div>

                  <div className="timeline-node">
                    <div className="timeline-time">Month 7+</div>
                    <div className="timeline-info">
                      <div className="timeline-heading">Commercial Mass Production</div>
                      <div className="timeline-body">Target initial assembly of 40 units/month. Secure partnerships with localized farming hubs.</div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Premium Platform Footer with fake links and Joseph Brian credits */}
        <footer className="platform-footer">
          <div className="footer-credits">
            TerraScan Platform Core BSECE Originator: <span>Joseph Brian</span>
          </div>
          <ul className="footer-links">
            <li><a href="#docs" onClick={(e) => e.preventDefault()}>API Docs</a></li>
            <li><a href="#staging" onClick={(e) => e.preventDefault()}>Security Sandbox</a></li>
            <li><a href="#feasibility" onClick={(e) => e.preventDefault()}>Feasibility Framework</a></li>
            <li><a href="#tup" onClick={(e) => e.preventDefault()}>TUP Manila Lab</a></li>
          </ul>
        </footer>

      </main>

      {/* -------------------- ADD NODE MODAL -------------------- */}
      {showAddNodeModal && (
        <div className="modal-overlay" onClick={() => setShowAddNodeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">＋ Add Field Telemetry Node</div>
            <div className="modal-desc">
              Define a new ESP32 spatial sensor array. Inputs will immediately calibrate recommendation scores.
            </div>

            <form onSubmit={handleAddNodeSubmit}>
              <div className="form-group">
                <label className="form-label">Node Station Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Batangas Tomato Garden" 
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Spatial Coordinates / Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Lipa City, Batangas" 
                  value={newNodeLocation}
                  onChange={(e) => setNewNodeLocation(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Baseline Moisture (%)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    className="form-input" 
                    value={newNodeMoisture}
                    onChange={(e) => setNewNodeMoisture(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Baseline soil pH (0-14)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="14" 
                    step="0.1" 
                    className="form-input" 
                    value={newNodePh}
                    onChange={(e) => setNewNodePh(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowAddNodeModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Calibrate &amp; Deploy Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
