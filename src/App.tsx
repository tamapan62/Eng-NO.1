import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  ResponsiveContainer,
  YAxis,
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  Cell,
  LabelList,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  MapPin,
  Store,
  Upload,
  Box,
  Settings,
  ChevronRight,
  Search,
  ChevronDown,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ChevronLeft,
  Filter,
  Download,
  RefreshCw,
  Activity,
  Clock,
  AlertTriangle,
  Check,
  FileSpreadsheet,
  Database,
  FileWarning,
} from "lucide-react";

// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

// ✅ CSV Parser V3 (CodeSandbox Infinite-Loop Bypass Edition)
// ใช้ Array methods เพื่อหลีกเลี่ยงการถูก CodeSandbox บล็อกลูปเกิน 100,000 รอบ
const parseCSV = (csvText) => {
  const rows = [];
  let row = [];
  let inQuotes = false;
  let currentValue = "";

  const lines = csvText.split("\n");

  lines.forEach((line) => {
    line = line.replace(/\r$/, "");

    const chars = line.split("");
    let skipNext = false;

    chars.forEach((char, i) => {
      if (skipNext) {
        skipNext = false;
        return;
      }

      if (char === '"') {
        if (inQuotes && chars[i + 1] === '"') {
          currentValue += '"';
          skipNext = true;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        row.push(currentValue);
        currentValue = "";
      } else {
        currentValue += char;
      }
    });

    if (inQuotes) {
      currentValue += "\n"; // หากยังอยู่ในเครื่องหมายคำพูด ให้ต่อบรรทัดใหม่
    } else {
      row.push(currentValue);
      if (row.some((val) => val.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      currentValue = "";
    }
  });

  return rows;
};

const formatMonthLabel = (YYYYMM) => {
  if (!YYYYMM) return "";
  const parts = YYYYMM.split("-");
  if (parts.length < 2) return YYYYMM;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
};

// ปรับปรุงไม่ให้ใช้ for loop ลดการแจ้งเตือนจาก Sandbox
const parseDateToTimestamp = (dateStr) => {
  if (!dateStr || dateStr === "-") return 0;

  const thaiMonthsObj = {
    "ม.ค.": 0,
    "ก.พ.": 1,
    "มี.ค.": 2,
    "เม.ย.": 3,
    "พ.ค.": 4,
    "มิ.ย.": 5,
    "ก.ค.": 6,
    "ส.ค.": 7,
    "ก.ย.": 8,
    "ต.ค.": 9,
    "พ.ย.": 10,
    "ธ.ค.": 11,
  };

  let matchedIdx = -1;
  Object.entries(thaiMonthsObj).some(([th, idx]) => {
    if (dateStr.includes(th)) {
      matchedIdx = idx;
      return true;
    }
    return false;
  });

  if (matchedIdx !== -1) {
    const parts = dateStr.split(" ");
    if (parts.length >= 3) {
      const d = parseInt(parts[0], 10);
      const y = parseInt(parts[2], 10);
      let h = 0,
        m = 0,
        s = 0;
      if (parts[3] && parts[3].includes(":")) {
        const tParts = parts[3].split(":");
        h = parseInt(tParts[0] || "0", 10);
        m = parseInt(tParts[1] || "0", 10);
        s = parseInt(tParts[2] || "0", 10);
      }
      return new Date(y, matchedIdx, d, h, m, s).getTime();
    }
  }

  if (dateStr.includes("/")) {
    const [datePart, timePart] = dateStr.split(" ");
    const dParts = datePart.split("/");
    if (dParts.length >= 3) {
      let p0 = parseInt(dParts[0], 10);
      let p1 = parseInt(dParts[1], 10);
      let p2 = parseInt(dParts[2], 10);
      let d, m, y;

      if (dParts[0].length === 4) {
        // รูปแบบ YYYY/MM/DD
        y = p0;
        m = p1 - 1;
        d = p2;
      } else if (p0 > 12) {
        // รูปแบบ DD/MM/YYYY (เช่น 30/1/2026)
        d = p0;
        m = p1 - 1;
        y = p2;
      } else {
        // รูปแบบ MM/DD/YYYY (เช่น 1/30/2026 หรือ 2/24/2026 ตามในภาพ)
        m = p0 - 1;
        d = p1;
        y = p2;
      }

      if (y < 100) y += 2000;
      let h = 0,
        min = 0,
        sec = 0;
      if (timePart) {
        const tParts = timePart.split(":");
        h = parseInt(tParts[0] || "0", 10);
        min = parseInt(tParts[1] || "0", 10);
        sec = parseInt(tParts[2] || "0", 10);
      }
      return new Date(y, m, d, h, min, sec).getTime();
    }
  }

  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) return parsed;
  return 0;
};

const getRankColor = (rank, count) => {
  if (count === 0 || rank === 0)
    return "bg-slate-800/40 text-slate-400 border-slate-700/50";
  if (rank === 1)
    return "bg-yellow-500 text-slate-950 font-black border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] cursor-pointer hover:scale-105 transition-transform";
  if (rank <= 3)
    return "bg-red-600 text-white font-bold border-red-500 cursor-pointer hover:scale-105 transition-transform";
  if (rank <= 10)
    return "bg-orange-600 text-white border-orange-500 cursor-pointer hover:scale-105 transition-transform";
  if (rank <= 20)
    return "bg-indigo-600 text-white border-indigo-500 cursor-pointer hover:scale-105 transition-transform";
  return "bg-slate-700 text-white border-slate-500 cursor-pointer hover:scale-105 transition-transform";
};

// ==========================================
// 2. MULTI-SELECT COMPONENT
// ==========================================
const MultiSearchSelect = React.memo(
  ({ label, options, selectedValues, onChange, placeholder = "ค้นหา..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);

    const filteredOptions = useMemo(() => {
      const term = searchTerm.toLowerCase();
      return options.filter((opt) => {
        const labelStr = (opt.label || opt.name || opt || "")
          .toString()
          .toLowerCase();
        return labelStr.includes(term);
      });
    }, [options, searchTerm]);

    const toggleValue = (val) => {
      if (val === "ALL") {
        onChange(["ALL"]);
      } else {
        let newValues = selectedValues.filter((v) => v !== "ALL");
        if (newValues.includes(val)) {
          newValues = newValues.filter((v) => v !== val);
          if (newValues.length === 0) newValues = ["ALL"];
        } else {
          newValues.push(val);
        }
        onChange(newValues);
      }
    };

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="space-y-1 relative" ref={containerRef}>
        <label className="text-[10px] font-black text-slate-300 uppercase ml-1 flex items-center gap-1">
          <Filter size={10} /> {label}
        </label>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full bg-slate-950/50 border ${
            isOpen ? "border-red-500" : "border-slate-700"
          } rounded-xl text-sm p-3 flex justify-between items-center cursor-pointer transition-all min-h-[48px]`}
        >
          <div className="flex flex-wrap gap-1 items-center max-w-[90%] overflow-hidden">
            {selectedValues.includes("ALL") ? (
              <span className="text-white font-bold">ทั้งหมด</span>
            ) : (
              selectedValues.map((v) => {
                const optFound = options.find((o) => (o.id || o) === v);
                const labelText = optFound?.label || optFound?.name || v;
                return (
                  <span
                    key={v}
                    className="bg-indigo-600 text-[10px] text-white px-2 py-0.5 rounded font-bold border border-indigo-400/30 flex items-center gap-1 whitespace-nowrap"
                  >
                    {labelText}
                    <X
                      size={8}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleValue(v);
                      }}
                      className="hover:text-red-200 cursor-pointer"
                    />
                  </span>
                );
              })
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-white transition-transform flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>

        {isOpen && (
          <div className="absolute z-[100] mt-2 w-full bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-2 border-b border-slate-600 flex items-center gap-2 bg-slate-900/50">
              <Search size={14} className="text-slate-300 ml-2" />
              <input
                autoFocus
                className="bg-transparent border-none focus:ring-0 text-sm w-full p-1 text-white placeholder-slate-400 outline-none"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              <div
                className={`p-3 text-sm cursor-pointer flex justify-between items-center hover:bg-slate-700 ${
                  selectedValues.includes("ALL")
                    ? "text-red-400 font-black bg-red-500/10"
                    : "text-white font-medium"
                }`}
                onClick={() => toggleValue("ALL")}
              >
                <span>ทั้งหมด ({label})</span>
                {selectedValues.includes("ALL") && (
                  <Check size={14} className="text-red-400" />
                )}
              </div>
              {filteredOptions.map((opt, idx) => {
                const val = opt.value || opt.id || opt;
                const lbl = opt.label || opt.name || opt;
                const isSelected = selectedValues.includes(val);
                return (
                  <div
                    key={idx}
                    className={`p-3 text-sm cursor-pointer flex justify-between items-center hover:bg-slate-700 border-t border-slate-700/50 ${
                      isSelected
                        ? "text-indigo-300 font-bold bg-indigo-500/10"
                        : "text-white"
                    }`}
                    onClick={() => toggleValue(val)}
                  >
                    <span className="truncate">{lbl}</span>
                    {isSelected && (
                      <Check size={14} className="text-indigo-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

// ==========================================
// 3. MAIN APPLICATION
// ==========================================
export default function App() {
  const DATA_SOURCES = useMemo(
    () => [
      {
        id: "E1A",
        name: "E1A",
        url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSCl9wpZxP3GeGyP-b3865kPRVdI--4auVNA9IshAg7NvpVhvlXLG27GnYZVDwqtb-hgIEwJ5SrTPVY/pub?output=csv",
      },
      {
        id: "E1B",
        name: "E1B",
        url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRKvd3xye3TO9mUcMIUYzsOCunYY3GvjZP0EfEw1vbJcuZjY3MFgd1isAT7yAja2WREu-4NKFOT6ade/pub?output=csv",
      },
      {
        id: "E3",
        name: "E3 All Cafe",
        url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vT33wSp7Lhy8iyCajYO5cVhWWKEIKBy4gRIp0YnkSB0szsA-e1ZwxJh7uCWz-rw5UlYqjlFtI4JV_mb/pub?output=csv",
      },
    ],
    []
  );

  const [selectedSource, setSelectedSource] = useState(DATA_SOURCES[0]);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  const [rawData, setRawData] = useState([]);
  const [months, setMonths] = useState([]);
  const [currentMonthIdx, setCurrentMonthIdx] = useState(0);
  const [filters, setFilters] = useState({
    area: ["ALL"],
    team: ["ALL"],
    branch: ["ALL"],
    productType: ["ALL"],
    system: ["ALL"],
  });

  const [selectedSortMonths, setSelectedSortMonths] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "rank",
    direction: "asc",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sheetTitle, setSheetTitle] = useState("");
  const ITEMS_PER_PAGE = 25;

  const [selectedCallDetails, setSelectedCallDetails] = useState(null);
  const [modalSortKey, setModalSortKey] = useState("date");
  const [modalSortDirection, setModalSortDirection] = useState("desc");

  // State เก็บค่า Filter ภายใน Modal เพื่อใช้กรองตามที่ผู้ใช้คลิก
  const [modalActiveFilter, setModalActiveFilter] = useState({
    type: null, // 'productType' | 'system' | 'problemType'
    value: null, // ค่าที่คลิกเพื่อทำการกรอง
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortConfig, currentMonthIdx, selectedSortMonths]);

  const fetchCloudData = useCallback(async () => {
    setIsLoading(true);
    setErrorObj(null);
    setSheetTitle("");

    if (!selectedSource.url) {
      setRawData([]);
      setMonths([]);
      setIsLoading(false);
      setSheetTitle("รอเพิ่มลิงก์ข้อมูล");
      return;
    }

    try {
      const response = await fetch(selectedSource.url);

      if (!response.ok) {
        throw new Error(
          `การดึงข้อมูลล้มเหลว (HTTP Status: ${response.status})`
        );
      }

      let extractedTitle = `${selectedSource.name} Data`;
      try {
        const cd = response.headers.get("content-disposition");
        if (cd) {
          const match = cd.match(/filename="?([^"]+)"?/);
          if (match && match[1])
            extractedTitle = match[1]
              .replace(/ - [^.]+\.csv$/, "")
              .replace(/\.csv$/, "");
        }
      } catch (e) {}
      setSheetTitle(extractedTitle);

      const text = await response.text();
      const cleanText = text.replace(/^\uFEFF/, "");

      const rows = parseCSV(cleanText);
      if (rows.length < 2) {
        throw new Error("โครงสร้างไฟล์ข้อมูลว่างเปล่าหรือไม่ถูกต้อง");
      }

      const headers = rows[0].map((h) =>
        h.replace(/[\u200B-\u200D\uFEFF"]/g, "").trim()
      );
      const formatted = [];
      const mSet = new Set();

      const getColValue = (rowArr, possibleHeaders) => {
        let idx = headers.findIndex((h) =>
          possibleHeaders.some((ph) => h.toLowerCase() === ph.toLowerCase())
        );
        if (idx !== -1) return rowArr[idx]?.trim() || "";

        idx = headers.findIndex((h) => {
          const headerLower = h.toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
          return possibleHeaders.some((ph) => {
            const searchLower = ph.toLowerCase().replace(/[^a-z0-9ก-๙]/g, "");
            if (searchLower === "age" && headerLower.includes("damaged"))
              return false;
            return headerLower.includes(searchLower);
          });
        });
        return idx !== -1 ? rowArr[idx]?.trim() || "" : "";
      };

      // ใช้ forEach เลี่ยงปัญหา Infinite Loop Protection ของ Sandbox
      rows.slice(1).forEach((rowDataArray) => {
        if (!rowDataArray || rowDataArray.length < 3) return;

        const dateVal = getColValue(rowDataArray, [
          "Create Date",
          "Created Date",
          "Date",
          "วันที่",
          "Create",
        ]);
        let rawMonth = getColValue(rowDataArray, ["Month", "เดือน"]);

        let monthKey = "";
        if (rawMonth) {
          const rawText = rawMonth.toString().trim().toLowerCase();
          let mStr = "";
          let yStr = "";

          const mMap = {
            jan: "01",
            feb: "02",
            mar: "03",
            apr: "04",
            may: "05",
            jun: "06",
            jul: "07",
            aug: "08",
            sep: "09",
            oct: "10",
            nov: "11",
            dec: "12",
            "ม.ค.": "01",
            "ก.พ.": "02",
            "มี.ค.": "03",
            "เม.ย.": "04",
            "พ.ค.": "05",
            "มิ.ย.": "06",
            "ก.ค.": "07",
            "ส.ค.": "08",
            "ก.ย.": "09",
            "ต.ค.": "10",
            "พ.ย.": "11",
            "ธ.ค.": "12",
          };

          Object.entries(mMap).some(([key, val]) => {
            if (rawText.includes(key)) {
              mStr = val;
              return true;
            }
            return false;
          });

          const yMatch = rawText.match(/\b(202\d|203\d|25|26|27|68|69)\b/);
          if (yMatch) {
            let y = yMatch[0];
            if (y.length === 2) {
              yStr = parseInt(y) > 50 ? `20${parseInt(y) - 43}` : `20${y}`;
            } else {
              yStr = y;
            }
          }

          if (!mStr) {
            const numMatch = rawText.match(/^(\d{1,2})[-/](\d{2,4})/);
            if (numMatch) {
              mStr = numMatch[1].padStart(2, "0");
              let y = numMatch[2];
              yStr = y.length === 2 ? `20${y}` : y;
            }
          }

          if (mStr) {
            if (!yStr) yStr = parseInt(mStr) >= 9 ? "2025" : "2026";
            if (parseInt(mStr) >= 9 && yStr === "2026") yStr = "2025";
            monthKey = `${yStr}-${mStr}`;
          }
        }

        if (!monthKey && dateVal) {
          const timestamp = parseDateToTimestamp(dateVal);
          if (timestamp > 0) {
            const d = new Date(timestamp);
            const mStr = (d.getMonth() + 1).toString().padStart(2, "0");
            let yStr = d.getFullYear().toString();
            if (parseInt(mStr) >= 9 && yStr === "2026") yStr = "2025";
            monthKey = `${yStr}-${mStr}`;
          }
        }

        if (!monthKey) return;
        mSet.add(monthKey);

        const ticketNo = getColValue(rowDataArray, [
          "Ticket Number",
          "Ticket No",
          "เลขที่ใบงาน",
          "Ticket",
          "เลขที่",
        ]);
        if (!ticketNo) return;

        formatted.push({
          ticket_no: ticketNo,
          date: dateVal,
          branch_id: getColValue(rowDataArray, [
            "Store Code",
            "Branch ID",
            "รหัสสาขา",
            "Store ID",
            "รหัส",
          ]),
          branch_name: getColValue(rowDataArray, [
            "Store Name",
            "Branch Name",
            "ชื่อสาขา",
            "ชื่อ",
          ]),
          area: getColValue(rowDataArray, ["Area", "เขต"]),
          team: getColValue(rowDataArray, ["Team", "ทีม"]),
          product_type: getColValue(rowDataArray, [
            "Product Type",
            "Product",
            "ประเภทอุปกรณ์",
            "ประเภท",
          ]),
          system: getColValue(rowDataArray, ["System", "ระบบ"]),
          problem_type: getColValue(rowDataArray, [
            "Problem Type",
            "Problem",
            "อาการเสีย",
            "อาการ",
          ]),
          damaged_parts: getColValue(rowDataArray, [
            "Damaged Parts",
            "Damaged Part",
            "ชิ้นส่วนที่เสียหาย",
            "ชิ้นส่วน",
          ]),
          cause: getColValue(rowDataArray, ["Cause", "สาเหตุ"]),
          equipment_age: getColValue(rowDataArray, [
            "อายุอุปกรณ์",
            "Equipment Age",
            "Age",
            "อายุ",
          ]),
          month: monthKey,
        });
      });

      const sortedMonths = Array.from(mSet).sort();
      setMonths(sortedMonths);
      setCurrentMonthIdx(sortedMonths.length > 0 ? sortedMonths.length - 1 : 0);
      setRawData(formatted);
    } catch (err) {
      console.error(err);
      setErrorObj(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSource]);

  useEffect(() => {
    setFilters({
      area: ["ALL"],
      team: ["ALL"],
      branch: ["ALL"],
      productType: ["ALL"],
      system: ["ALL"],
    });
    setSelectedSortMonths([]);
    setSortConfig({ key: "rank", direction: "asc" });
    fetchCloudData();
  }, [selectedSource, fetchCloudData]);

  const handleExportCSV = () => {
    if (!rawData.length) return;

    const filteredData = rawData.filter(
      (d) =>
        (filters.area.includes("ALL") || filters.area.includes(d.area)) &&
        (filters.team.includes("ALL") || filters.team.includes(d.team)) &&
        (filters.branch.includes("ALL") ||
          filters.branch.includes(d.branch_id)) &&
        (filters.productType.includes("ALL") ||
          filters.productType.includes(d.product_type)) &&
        (filters.system.includes("ALL") || filters.system.includes(d.system))
    );

    const csvHeaders = [
      "Ticket No",
      "Date",
      "Branch ID",
      "Branch Name",
      "Area",
      "Team",
      "Product Type",
      "System",
      "Problem Type",
      "Damaged Parts",
      "Cause",
      "Equipment Age",
      "Month",
    ];
    const csvRows = filteredData.map((d) =>
      [
        `"${d.ticket_no}"`,
        `"${d.date}"`,
        `"${d.branch_id}"`,
        `"${d.branch_name}"`,
        `"${d.area}"`,
        `"${d.team}"`,
        `"${d.product_type}"`,
        `"${d.system}"`,
        `"${d.problem_type}"`,
        `"${d.damaged_parts?.replace(/"/g, '""')}"`,
        `"${d.cause?.replace(/"/g, '""')}"`,
        `"${d.equipment_age}"`,
        `"${d.month}"`,
      ].join(",")
    );

    const csvContent = "\uFEFF" + [csvHeaders.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `maintenance_league_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const options = useMemo(() => {
    const areas = new Set(),
      teams = new Set(),
      branches = new Map(),
      productTypes = new Set(),
      systems = new Set();
    rawData.forEach((d) => {
      if (d.area) areas.add(d.area);
      if (d.team) teams.add(d.team);
      if (d.product_type) productTypes.add(d.product_type);
      if (d.system) systems.add(d.system);

      const isAreaMatch =
        filters.area.includes("ALL") || filters.area.includes(d.area);
      const isTeamMatch =
        filters.team.includes("ALL") || filters.team.includes(d.team);
      if (isAreaMatch && isTeamMatch && d.branch_id) {
        branches.set(d.branch_id, d.branch_name || d.branch_id);
      }
    });
    return {
      areas: Array.from(areas).sort(),
      teams: Array.from(teams).sort(),
      productTypes: Array.from(productTypes).sort(),
      systems: Array.from(systems).sort(),
      branches: Array.from(branches.entries())
        .map(([id, name]) => ({ id, label: `${id} - ${name}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [rawData, filters.area, filters.team]);

  const viewData = useMemo(() => {
    if (!rawData.length || !months.length)
      return { table: [], charts: { prod: [], sys: [] } };
    const bStats = new Map();

    const filteredForCalc = rawData.filter(
      (d) =>
        (filters.area.includes("ALL") || filters.area.includes(d.area)) &&
        (filters.team.includes("ALL") || filters.team.includes(d.team)) &&
        (filters.productType.includes("ALL") ||
          filters.productType.includes(d.product_type)) &&
        (filters.system.includes("ALL") || filters.system.includes(d.system))
    );

    filteredForCalc.forEach((d) => {
      if (!bStats.has(d.branch_id)) {
        bStats.set(d.branch_id, {
          id: d.branch_id,
          name: d.branch_name || d.branch_id,
          area: d.area,
          team: d.team,
          monthlyCounts: {},
          monthlyData: {},
          allCalls: [],
        });
      }
      const branchObj = bStats.get(d.branch_id);
      branchObj.monthlyCounts[d.month] =
        (branchObj.monthlyCounts[d.month] || 0) + 1;
      branchObj.allCalls.push(d);
      if (!branchObj.monthlyData[d.month]) branchObj.monthlyData[d.month] = [];
      branchObj.monthlyData[d.month].push(d);
      if (!branchObj.name && d.branch_name) branchObj.name = d.branch_name;
    });

    const currentMonthKey = months[currentMonthIdx];
    const prevMonthIdx = currentMonthIdx > 0 ? currentMonthIdx - 1 : -1;
    const prevMonthKey = prevMonthIdx !== -1 ? months[prevMonthIdx] : null;

    const monthlyRanksMap = {};
    months.forEach((m) => {
      const scores = Array.from(bStats.values()).map((b) => ({
        id: b.id,
        count: b.monthlyCounts[m] || 0,
      }));
      monthlyRanksMap[m] = scores
        .sort((a, b) =>
          b.count !== a.count ? b.count - a.count : a.id.localeCompare(b.id)
        )
        .reduce((acc, cur, idx) => {
          acc[cur.id] = cur.count > 0 ? idx + 1 : 0;
          return acc;
        }, {});
    });

    const cumulativeScores = Array.from(bStats.values()).map((b) => {
      let total = b.allCalls.length;
      return { id: b.id, total };
    });
    cumulativeScores.sort((a, b) =>
      b.total !== a.total ? b.total - a.total : a.id.localeCompare(b.id)
    );
    const cumulativeRanks = {};
    cumulativeScores.forEach((item, index) => {
      cumulativeRanks[item.id] = item.total > 0 ? index + 1 : 0;
    });

    const table = Array.from(bStats.values())
      .filter(
        (b) => filters.branch.includes("ALL") || filters.branch.includes(b.id)
      )
      .map((b) => {
        const cRank = monthlyRanksMap[currentMonthKey]?.[b.id] || 0;
        const pRank = prevMonthKey
          ? monthlyRanksMap[prevMonthKey]?.[b.id] || 0
          : 0;
        return {
          branch_id: b.id,
          branch_name: b.name,
          area: b.area,
          team: b.team,
          rank: cumulativeRanks[b.id] || 0,
          movement: cRank > 0 && pRank > 0 ? pRank - cRank : 0,
          total_calls: b.allCalls.length,
          history: months.map((m) => ({
            month: m,
            count: b.monthlyCounts[m] || 0,
            rank: monthlyRanksMap[m]?.[b.id] || 0,
            calls: b.monthlyData[m] || [],
          })),
          allCalls: b.allCalls,
        };
      });

    const prodCount = {};
    const sysCount = {};
    let totalProd = 0;
    let totalSys = 0;

    filteredForCalc.forEach((d) => {
      prodCount[d.product_type] = (prodCount[d.product_type] || 0) + 1;
      sysCount[d.system] = (sysCount[d.system] || 0) + 1;
      totalProd++;
      totalSys++;
    });

    const chartData = (counts, total) =>
      Object.entries(counts)
        .map(([name, value]) => ({
          name: name || "N/A",
          value,
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

    return {
      table,
      charts: {
        prod: chartData(prodCount, totalProd),
        sys: chartData(sysCount, totalSys),
      },
    };
  }, [rawData, months, currentMonthIdx, filters]);

  const handleToggleSortMonth = useCallback((monthKey) => {
    setSelectedSortMonths((prev) => {
      if (prev.includes(monthKey)) {
        const next = prev.filter((m) => m !== monthKey);
        if (next.length === 0) {
          setSortConfig({ key: "rank", direction: "asc" });
        } else {
          setSortConfig({ key: "multi_month_sort", direction: "desc" });
        }
        return next;
      } else {
        setSortConfig({ key: "multi_month_sort", direction: "desc" });
        return [...prev, monthKey];
      }
    });
  }, []);

  const sortedTableData = useMemo(() => {
    let sortable = [...viewData.table];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === "multi_month_sort") {
          valA = selectedSortMonths.reduce(
            (sum, m) =>
              sum + (a.history.find((h) => h.month === m)?.count || 0),
            0
          );
          valB = selectedSortMonths.reduce(
            (sum, m) =>
              sum + (b.history.find((h) => h.month === m)?.count || 0),
            0
          );
        } else if (months.includes(sortConfig.key)) {
          valA = a.history.find((h) => h.month === sortConfig.key)?.count || 0;
          valB = b.history.find((h) => h.month === sortConfig.key)?.count || 0;
        } else {
          valA = a[sortConfig.key];
          valB = b[sortConfig.key];
        }

        if (typeof valA === "string")
          return sortConfig.direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        if (sortConfig.key === "rank") {
          if (valA === 0) return 1;
          if (valB === 0) return -1;
        }
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      });
    }
    return sortable;
  }, [viewData.table, sortConfig, months, selectedSortMonths]);

  // ประมวลผลข้อมูลตารางรายการซ่อมภายใน Pop-up Modal (รองรับ Dynamic Filter)
  const sortedModalCalls = useMemo(() => {
    if (!selectedCallDetails) return [];
    let calls = [...selectedCallDetails.calls];

    // ✅ กรองตามตัวเลือกที่คลิกจากการ์ดสรุปผล
    if (modalActiveFilter.type && modalActiveFilter.value) {
      const { type, value } = modalActiveFilter;
      calls = calls.filter((call) => {
        if (type === "productType") return call.product_type === value;
        if (type === "system") return call.system === value;
        if (type === "problemType") return call.problem_type === value;
        return true;
      });
    }

    calls.sort((a, b) => {
      let valA, valB;
      if (modalSortKey === "date") {
        valA = parseDateToTimestamp(a.date);
        valB = parseDateToTimestamp(b.date);
      } else if (modalSortKey === "age") {
        valA = parseFloat(a.equipment_age) || 0;
        valB = parseFloat(b.equipment_age) || 0;
      }

      if (modalSortDirection === "asc") return valA - valB;
      return valB - valA;
    });

    return calls;
  }, [
    selectedCallDetails,
    modalSortKey,
    modalSortDirection,
    modalActiveFilter,
  ]);

  const handleModalSort = (key) => {
    if (modalSortKey === key) {
      setModalSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setModalSortKey(key);
      setModalSortDirection("desc");
    }
  };

  // จัดการการคลิกที่ไอเทมในสรุปการ์ดย่อยของ Pop-up Modal เพื่อ Toggle กรองข้อมูล
  const handleToggleModalFilter = useCallback((type, value) => {
    setModalActiveFilter((prev) => {
      if (prev.type === type && prev.value === value) {
        return { type: null, value: null }; // กดซ้ำเพื่อปลดฟิลเตอร์
      }
      return { type, value }; // กดเพื่อเลือกกรอง
    });
  }, []);

  // ฟังก์ชันรีเซ็ตฟิลเตอร์ภายใน Modal
  const handleClearModalFilter = useCallback(() => {
    setModalActiveFilter({ type: null, value: null });
  }, []);

  const renderCustomBarLabel = (props, dataArray) => {
    const { x, y, width, height, value, index } = props;
    const item = dataArray[index];
    if (!item) return null;
    const isSmall = width < 55;
    return (
      <text
        x={x + (isSmall ? width + 5 : width - 8)}
        y={y + height / 2 + 1}
        fill={isSmall ? "#cbd5e1" : "#ffffff"}
        textAnchor={isSmall ? "start" : "end"}
        dominantBaseline="central"
        fontSize={10}
        fontWeight="black"
      >
        {value} ({item.percentage}%)
      </text>
    );
  };

  const getSortIcon = (key) => {
    if (key === "multi_month_sort") {
      return sortConfig.direction === "asc" ? (
        <ArrowUp size={12} className="text-red-400" />
      ) : (
        <ArrowDown size={12} className="text-red-400" />
      );
    }
    if (sortConfig.key !== key)
      return <ArrowUpDown size={12} className="opacity-30" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp size={12} className="text-red-400" />
    ) : (
      <ArrowDown size={12} className="text-red-400" />
    );
  };

  const getModalSummary = (calls) => {
    const stats = { prod: {}, sys: {}, prob: {}, age: [] };
    const total = calls.length;
    for (let i = 0; i < calls.length; i++) {
      const c = calls[i];
      if (c.product_type)
        stats.prod[c.product_type] = (stats.prod[c.product_type] || 0) + 1;
      if (c.system) stats.sys[c.system] = (stats.sys[c.system] || 0) + 1;
      if (c.problem_type)
        stats.prob[c.problem_type] = (stats.prob[c.problem_type] || 0) + 1;
      if (c.equipment_age && !isNaN(parseFloat(c.equipment_age)))
        stats.age.push(parseFloat(c.equipment_age));
    }

    // คำนวณเปอร์เซ็นต์และแนบค่ากลับไปพร้อมกับ count
    const getSorted = (obj) =>
      Object.entries(obj)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val]) => [
          name,
          val,
          total > 0 ? ((val / total) * 100).toFixed(1) : 0,
        ]);

    const maxAge = stats.age.length ? Math.max(...stats.age).toFixed(0) : "-";

    return {
      allProd: getSorted(stats.prod),
      allSys: getSorted(stats.sys),
      allProb: getSorted(stats.prob),
      maxAge,
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans overflow-x-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ef4444; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-modal { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 border-b border-slate-800/60 pb-10">
        <div className="flex flex-col gap-4">
          {/* --- Dropdown เลือกทีม --- */}
          <div className="relative z-50 self-start">
            <button
              onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <Database size={16} className="text-indigo-400" />
              <span>
                เลือกข้อมูลที่แสดง:{" "}
                <span className="text-indigo-300 ml-1">
                  {selectedSource.name}
                </span>
              </span>
              <ChevronDown
                size={14}
                className={`text-slate-400 ml-2 transition-transform duration-200 ${
                  isSourceDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isSourceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSourceDropdownOpen(false)}
                ></div>
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="p-3 border-b border-slate-700 bg-slate-900/80 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Check size={12} /> เลือกทีมที่ต้องการดู
                  </div>
                  {DATA_SOURCES.map((src) => (
                    <button
                      key={src.id}
                      onClick={() => {
                        setSelectedSource(src);
                        setIsSourceDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                        selectedSource.id === src.id
                          ? "bg-indigo-500/10 text-indigo-300 border-l-4 border-indigo-500"
                          : "text-slate-300 border-l-4 border-transparent"
                      }`}
                    >
                      {selectedSource.id === src.id && (
                        <Check size={14} className="text-indigo-400" />
                      )}
                      <span
                        className={selectedSource.id === src.id ? "" : "ml-5"}
                      >
                        {src.name}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4 italic tracking-tighter">
            <Trophy className="text-yellow-500" size={48} />
            <span>
              TOP {selectedSource.name.toUpperCase().replace(" ALL CAFE", "")}{" "}
              MAINTENANCE{" "}
              <span className="text-red-600 underline decoration-red-600/30 underline-offset-8">
                LEAGUE
              </span>
            </span>
          </h1>
          <div className="flex items-center gap-3 mt-2 text-white font-bold text-xs tracking-widest uppercase">
            <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              PERFORMANCE
            </span>
            {isLoading ? (
              <span className="flex items-center gap-2 animate-pulse text-white">
                <Loader2 size={12} className="animate-spin" /> SYNCING...
              </span>
            ) : (
              <span className="text-red-400 font-black">
                {rawData.length.toLocaleString()} TOTAL CALLS
              </span>
            )}
          </div>
        </div>
        <div className="w-full xl:w-auto flex flex-col items-end gap-3">
          {!isLoading && !errorObj && sheetTitle && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-800/80 px-4 py-2 rounded-full border border-slate-600 shadow-md animate-in fade-in slide-in-from-right-4 duration-500">
              <FileSpreadsheet size={14} className="text-green-400" />
              <span className="tracking-wide">
                ไฟล์ข้อมูล: <span className="text-white">{sheetTitle}</span>
              </span>
              <Check size={14} className="text-green-400 ml-1" />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-end">
            <button
              onClick={handleExportCSV}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl font-black flex justify-center items-center gap-3 transition-all shadow-lg shadow-green-900/20"
            >
              <FileSpreadsheet size={20} /> EXCEL EXPORT
            </button>
            <button
              onClick={fetchCloudData}
              className="bg-white hover:bg-slate-200 text-slate-950 px-8 py-4 rounded-2xl font-black flex justify-center items-center gap-3 transition-all shadow-xl active:scale-95"
            >
              <RefreshCw
                size={20}
                className={isLoading ? "animate-spin" : ""}
              />{" "}
              REFRESH DATA
            </button>
          </div>
        </div>
      </header>

      {/* แจ้งเตือนกรณีเกิดข้อผิดพลาดในการโหลด */}
      {errorObj && (
        <div className="bg-red-950 border border-red-500/50 p-6 rounded-[2rem] flex flex-col items-center justify-center mb-8 gap-4 shadow-xl">
          <FileWarning size={48} className="text-red-400" />
          <div className="text-center">
            <h2 className="text-xl font-black text-white">
              ไม่สามารถโหลดข้อมูล {selectedSource.name} ได้ชั่วคราว
            </h2>
            <p className="text-sm text-red-200 mt-2 max-w-lg mx-auto">
              {errorObj}
            </p>
          </div>
          <button
            onClick={fetchCloudData}
            className="mt-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-900/50"
          >
            ลองโหลดใหม่อีกครั้ง
          </button>
        </div>
      )}

      <div
        className={`grid grid-cols-12 gap-6 mb-8 ${
          errorObj ? "opacity-30 pointer-events-none" : ""
        }`}
      >
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-slate-900/60 border border-slate-700 p-6 rounded-[2.5rem] backdrop-blur-xl sticky top-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} className="text-red-500" /> Filter Engine
            </h3>
            <MultiSearchSelect
              label="Area (เขต)"
              options={options.areas}
              selectedValues={filters.area}
              onChange={(v) =>
                setFilters((p) => ({
                  ...p,
                  area: v,
                  team: ["ALL"],
                  branch: ["ALL"],
                }))
              }
            />
            <MultiSearchSelect
              label="Team (ทีม)"
              options={options.teams}
              selectedValues={filters.team}
              onChange={(v) =>
                setFilters((p) => ({ ...p, team: v, branch: ["ALL"] }))
              }
            />
            <MultiSearchSelect
              label="Branch (สาขา)"
              options={options.branches}
              selectedValues={filters.branch}
              onChange={(v) => setFilters((p) => ({ ...p, branch: v }))}
            />
            <div className="pt-4 border-t border-slate-700/50">
              <MultiSearchSelect
                label="Product (ประเภทงาน)"
                options={options.productTypes}
                selectedValues={filters.productType}
                onChange={(v) => setFilters((p) => ({ ...p, productType: v }))}
              />
            </div>
            <MultiSearchSelect
              label="System (ระบบ)"
              options={options.systems}
              selectedValues={filters.system}
              onChange={(v) => setFilters((p) => ({ ...p, system: v }))}
            />
            <button
              onClick={() => {
                setFilters({
                  area: ["ALL"],
                  team: ["ALL"],
                  branch: ["ALL"],
                  productType: ["ALL"],
                  system: ["ALL"],
                });
                setSelectedSortMonths([]);
                setSortConfig({ key: "rank", direction: "asc" });
              }}
              className="w-full py-4 text-[10px] font-black text-white hover:text-white transition-all border border-slate-700 rounded-2xl hover:bg-red-600 hover:border-red-500 uppercase tracking-widest bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-700 p-6 rounded-[2rem] h-60 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
                  <Box size={16} /> Top Product (งานรวมทุกเดือน)
                </h3>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-black">
                  ALL DATA
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={viewData.charts.prod}
                  layout="vertical"
                  margin={{ left: 0, right: 60 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: "#f1f5f9", fontSize: 10, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      fontSize: "10px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {viewData.charts.prod.map((e, i) => (
                      <Cell key={i} fill={i === 0 ? "#3b82f6" : "#475569"} />
                    ))}
                    <LabelList
                      dataKey="value"
                      content={(p) =>
                        renderCustomBarLabel(p, viewData.charts.prod)
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 p-6 rounded-[2rem] h-60 flex flex-col justify-between shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings size={16} /> Top Systems (ระบบที่เสียรวม)
                </h3>
                <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 font-black">
                  ALL DATA
                </span>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={viewData.charts.sys}
                  layout="vertical"
                  margin={{ left: 0, right: 60 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={140}
                    tick={{ fill: "#f1f5f9", fontSize: 10, fontWeight: "bold" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "12px",
                      fontSize: "10px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {viewData.charts.sys.map((e, i) => (
                      <Cell key={i} fill={i === 0 ? "#ef4444" : "#475569"} />
                    ))}
                    <LabelList
                      dataKey="value"
                      content={(p) =>
                        renderCustomBarLabel(p, viewData.charts.sys)
                      }
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 border border-indigo-500/30 p-6 rounded-[2rem] flex flex-col justify-center shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black uppercase text-indigo-300 flex items-center gap-2">
                <Calendar size={14} /> TABLE VIEW PERIOD
                (เลือกเดือนเพื่อดูอันดับในตาราง)
              </h3>
              <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-black shadow-lg border border-indigo-400/30 uppercase tracking-widest">
                {formatMonthLabel(months[currentMonthIdx])}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={months.length > 0 ? months.length - 1 : 0}
              value={currentMonthIdx}
              onChange={(e) => setCurrentMonthIdx(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-700"
            />
            <div className="flex justify-between mt-3 px-1">
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {formatMonthLabel(months[0])}
              </span>
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {formatMonthLabel(months[months.length - 1])}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-[2.5rem] overflow-hidden border border-slate-700 shadow-2xl backdrop-blur-sm">
            {selectedSortMonths.length > 0 && (
              <div className="bg-indigo-950/80 border-b border-indigo-500/30 p-4 px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-300 animate-pulse">
                    <Activity size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">
                      กำลังเรียงลำดับแบบหลายเดือนพร้อมกัน (Multi-Month Sorting)
                    </div>
                    <div className="text-[10px] text-indigo-200 mt-1">
                      คำนวณจากเคสซ่อมรวมของเดือน:{" "}
                      <span className="text-red-400 font-bold">
                        {selectedSortMonths
                          .map((m) => formatMonthLabel(m))
                          .join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSortMonths([]);
                    setSortConfig({ key: "rank", direction: "asc" });
                  }}
                  className="bg-indigo-600 hover:bg-red-600 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border border-indigo-400/30 transition-all flex items-center gap-1.5"
                >
                  <X size={10} /> ล้างการเรียงลำดับหลายเดือน
                </button>
              </div>
            )}

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-700 uppercase text-[10px] font-black text-white tracking-widest">
                    <th
                      className="p-6 text-center w-24 cursor-pointer hover:bg-slate-800 transition-colors"
                      onClick={() => {
                        setSelectedSortMonths([]);
                        setSortConfig({
                          key: "rank",
                          direction:
                            sortConfig.key === "rank" &&
                            sortConfig.direction === "asc"
                              ? "desc"
                              : "asc",
                        });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        RANK {getSortIcon("rank")}
                      </div>
                    </th>
                    <th
                      className="p-6 text-center w-28 cursor-pointer hover:bg-slate-800 transition-colors"
                      onClick={() => {
                        setSelectedSortMonths([]);
                        setSortConfig({
                          key: "movement",
                          direction:
                            sortConfig.key === "movement" &&
                            sortConfig.direction === "desc"
                              ? "asc"
                              : "desc",
                        });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        TREND {getSortIcon("movement")}
                      </div>
                    </th>
                    <th
                      className="p-6 cursor-pointer hover:bg-slate-800 transition-colors"
                      onClick={() => {
                        setSelectedSortMonths([]);
                        setSortConfig({
                          key: "branch_name",
                          direction:
                            sortConfig.key === "branch_name" &&
                            sortConfig.direction === "asc"
                              ? "desc"
                              : "asc",
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        BRANCH INFO {getSortIcon("branch_name")}
                      </div>
                    </th>
                    {months.map((m) => {
                      const isMonthInMultiSort = selectedSortMonths.includes(m);
                      return (
                        <th
                          key={m}
                          className={`p-3 text-center transition-all cursor-pointer relative group/th ${
                            isMonthInMultiSort
                              ? "text-indigo-300 bg-indigo-500/20 border-x border-indigo-500/30"
                              : m === months[currentMonthIdx]
                              ? "text-red-400 bg-red-500/10"
                              : "hover:bg-slate-800 text-white"
                          }`}
                          onClick={() => handleToggleSortMonth(m)}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            {formatMonthLabel(m).split(" ")[0]}
                            {isMonthInMultiSort ? (
                              <div className="flex items-center justify-center bg-indigo-500 text-white rounded-full p-0.5 mt-0.5">
                                <Check size={8} />
                              </div>
                            ) : (
                              getSortIcon(m)
                            )}
                          </div>

                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-[8px] px-2 py-1 rounded shadow-xl opacity-0 group-hover/th:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {isMonthInMultiSort
                              ? "คลิกเพื่อยกเลิกการจัดเรียงเดือนนี้"
                              : "คลิกเพื่อเพิ่มในการจัดเรียงหลายเดือน"}
                          </div>
                        </th>
                      );
                    })}
                    <th
                      className="p-6 text-center text-indigo-300 w-32 bg-indigo-500/10 cursor-pointer hover:bg-indigo-500/20 transition-colors"
                      onClick={() => {
                        setSelectedSortMonths([]);
                        setSortConfig({
                          key: "total_calls",
                          direction:
                            sortConfig.key === "total_calls" &&
                            sortConfig.direction === "desc"
                              ? "asc"
                              : "desc",
                        });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        ACCUM {getSortIcon("total_calls")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {sortedTableData.length > 0 ? (
                    sortedTableData
                      .slice(
                        (currentPage - 1) * ITEMS_PER_PAGE,
                        currentPage * ITEMS_PER_PAGE
                      )
                      .map((row) => {
                        const sumMultiCalls = selectedSortMonths.reduce(
                          (sum, m) =>
                            sum +
                            (row.history.find((h) => h.month === m)?.count ||
                              0),
                          0
                        );

                        return (
                          <tr
                            key={row.branch_id}
                            className={`hover:bg-slate-800/60 transition-all group ${
                              selectedSortMonths.length > 0
                                ? "border-l-4 border-indigo-500"
                                : ""
                            }`}
                          >
                            <td className="p-6 text-center text-2xl font-black italic text-white">
                              {selectedSortMonths.length > 0 ? (
                                <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 py-1.5 rounded-xl border border-indigo-500/20">
                                  <span>ซ่อมรวม</span>
                                  <div className="text-lg font-black text-white mt-0.5">
                                    {sumMultiCalls}
                                  </div>
                                </div>
                              ) : row.rank > 0 ? (
                                `#${row.rank}`
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex justify-center">
                                {row.movement > 0 ? (
                                  <div className="text-red-400 bg-red-500/10 px-2 py-1 rounded-full text-[8px] font-black flex items-center gap-1">
                                    <TrendingUp size={12} />+{row.movement}
                                  </div>
                                ) : row.movement < 0 ? (
                                  <div className="text-green-400 bg-green-500/10 px-2 py-1 rounded-full text-[8px] font-black flex items-center gap-1">
                                    <TrendingDown size={12} />
                                    {row.movement}
                                  </div>
                                ) : (
                                  <Minus
                                    size={12}
                                    className="opacity-50 text-slate-400"
                                  />
                                )}
                              </div>
                            </td>
                            <td className="p-6">
                              <div
                                onClick={() => {
                                  setSelectedCallDetails({
                                    month: "ALL",
                                    branchName: row.branch_name,
                                    branchId: row.branch_id,
                                    area: row.area,
                                    team: row.team,
                                    calls: row.allCalls,
                                    isTotal: true,
                                  });
                                  setModalSortKey("date");
                                  setModalSortDirection("desc");
                                  setModalActiveFilter({
                                    type: null,
                                    value: null,
                                  }); // รีเซ็ตฟิลเตอร์เมื่อเปิดบราวเซอร์ตัวใหม่
                                }}
                                className="cursor-pointer group/branch"
                              >
                                <div className="font-black text-white text-base group-hover/branch:text-red-400 transition-colors flex items-center gap-2">
                                  {row.branch_name || row.branch_id}
                                  <ChevronRight
                                    size={16}
                                    className="opacity-0 group-hover/branch:opacity-100 -translate-x-2 group-hover/branch:translate-x-0 transition-all text-red-400"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <span className="text-[9px] text-white font-bold uppercase bg-slate-800 px-2 py-0.5 rounded border border-slate-600">
                                  {row.branch_id}
                                </span>
                                <span className="text-[9px] text-indigo-300 font-bold uppercase bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                                  {row.area} | {row.team}
                                </span>
                              </div>
                            </td>
                            {row.history.map((h, i) => {
                              const isMonthSelectedInMulti =
                                selectedSortMonths.includes(h.month);
                              return (
                                <td
                                  key={i}
                                  className={`p-1 ${
                                    isMonthSelectedInMulti
                                      ? "bg-indigo-500/5 border-x border-indigo-500/10"
                                      : ""
                                  }`}
                                >
                                  <div
                                    onClick={() => {
                                      if (h.count > 0) {
                                        setSelectedCallDetails({
                                          month: h.month,
                                          branchName: row.branch_name,
                                          branchId: row.branch_id,
                                          area: row.area,
                                          team: row.team,
                                          calls: h.calls,
                                          isTotal: false,
                                        });
                                        setModalSortKey("date");
                                        setModalSortDirection("desc");
                                        setModalActiveFilter({
                                          type: null,
                                          value: null,
                                        }); // รีเซ็ตฟิลเตอร์เมื่อเปลี่ยนห้องซ่อมย่อย
                                      }
                                    }}
                                    className={`w-full h-14 flex flex-col items-center justify-center rounded-xl transition-all border-2 ${getRankColor(
                                      h.rank,
                                      h.count
                                    )} ${
                                      isMonthSelectedInMulti
                                        ? "ring-2 ring-indigo-400 scale-105 shadow-md border-indigo-300"
                                        : h.month === months[currentMonthIdx]
                                        ? "ring-2 ring-white/60 scale-105 shadow-lg"
                                        : "opacity-70 group-hover:opacity-100 hover:scale-105"
                                    }`}
                                  >
                                    <div className="text-sm font-black text-white">
                                      {h.rank > 0 ? h.rank : "-"}
                                    </div>
                                    <div className="text-[9px] font-bold text-white opacity-90">
                                      ({h.count})
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-6 text-center bg-indigo-500/10">
                              <div className="text-2xl font-black text-white">
                                {row.total_calls}
                              </div>
                              <div className="text-[8px] font-black text-indigo-300 uppercase mt-1">
                                TOTAL CALLS
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td
                        colSpan={months.length + 4}
                        className="p-20 text-center text-slate-500 font-bold"
                      >
                        {isLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2
                              className="animate-spin text-indigo-500 mx-auto mb-4"
                              size={32}
                            />
                            กำลังโหลดข้อมูล...
                          </div>
                        ) : (
                          "ไม่พบข้อมูล กรุณาตรวจสอบไฟล์ CSV"
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-950/40 border-t border-slate-700 flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                PAGE {currentPage} OF{" "}
                {Math.ceil(sortedTableData.length / ITEMS_PER_PAGE) || 1}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 disabled:opacity-30 text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 disabled:opacity-30 text-white"
                  disabled={
                    currentPage >=
                    Math.ceil(sortedTableData.length / ITEMS_PER_PAGE)
                  }
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedCallDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
            onClick={() => setSelectedCallDetails(null)}
          ></div>
          <div className="bg-slate-900 border border-slate-600 w-full max-w-7xl max-h-[90vh] rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative z-10 flex flex-col animate-modal">
            <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 italic font-black text-2xl text-white">
                  CL
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase bg-indigo-600 text-white tracking-widest shadow-sm">
                      {selectedCallDetails.isTotal
                        ? "CUMULATIVE PERFORMANCE"
                        : "MONTHLY CALL DETAILS"}
                    </span>
                    <span className="text-white text-[10px] font-black uppercase bg-red-500/20 px-3 py-1 rounded-full border border-red-500/40">
                      {selectedCallDetails.isTotal
                        ? "ทุกช่วงเวลา"
                        : formatMonthLabel(selectedCallDetails.month)}
                    </span>
                    {/* ป้ายแสดงตัวกรองที่เลือกใน Modal อยู่ขณะนี้ */}
                    {modalActiveFilter.type && (
                      <span className="bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                        กรองตาม: {modalActiveFilter.value}
                        <X
                          size={12}
                          className="cursor-pointer hover:text-white"
                          onClick={handleClearModalFilter}
                        />
                      </span>
                    )}
                  </div>
                  <h2 className="text-3xl font-black text-white italic mt-2 tracking-tight">
                    {selectedCallDetails.branchName}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCallDetails(null);
                  handleClearModalFilter();
                }}
                className="h-12 w-12 bg-slate-700 hover:bg-red-600 text-white rounded-2xl transition-all flex items-center justify-center group"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8 custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 1. ALL PRODUCT TYPES Card */}
                <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl shadow-inner flex flex-col max-h-[200px]">
                  <h4 className="text-[10px] font-black text-blue-300 uppercase mb-3 flex items-center gap-2 tracking-widest sticky top-0 bg-slate-800/0 py-1">
                    <Box size={14} /> ALL PRODUCT TYPES
                  </h4>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {getModalSummary(selectedCallDetails.calls).allProd.map(
                      ([name, val, pct], idx) => {
                        const isFiltered =
                          modalActiveFilter.type === "productType" &&
                          modalActiveFilter.value === name;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              handleToggleModalFilter("productType", name)
                            }
                            className={`flex justify-between items-center border-b border-slate-700/30 pb-1.5 pt-0.5 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-800 ${
                              isFiltered
                                ? "bg-indigo-600/30 border-l-4 border-indigo-500 text-indigo-300 font-black"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="text-[11px] font-bold truncate max-w-[70%]">
                              {name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[8px] font-bold ${
                                  isFiltered
                                    ? "text-indigo-300"
                                    : "text-slate-500"
                                }`}
                              >
                                {pct}%
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 rounded-full min-w-[24px] text-center ${
                                  isFiltered
                                    ? "bg-indigo-500 text-white"
                                    : "bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {val}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 2. ALL SYSTEMS Card */}
                <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl shadow-inner flex flex-col max-h-[200px]">
                  <h4 className="text-[10px] font-black text-red-400 uppercase mb-3 flex items-center gap-2 tracking-widest sticky top-0 bg-slate-800/0 py-1">
                    <Settings size={14} /> ALL SYSTEMS
                  </h4>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {getModalSummary(selectedCallDetails.calls).allSys.map(
                      ([name, val, pct], idx) => {
                        const isFiltered =
                          modalActiveFilter.type === "system" &&
                          modalActiveFilter.value === name;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              handleToggleModalFilter("system", name)
                            }
                            className={`flex justify-between items-center border-b border-slate-700/30 pb-1.5 pt-0.5 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-800 ${
                              isFiltered
                                ? "bg-red-600/20 border-l-4 border-red-500 text-red-300 font-black"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="text-[11px] font-bold truncate max-w-[70%]">
                              {name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[8px] font-bold ${
                                  isFiltered ? "text-red-300" : "text-slate-500"
                                }`}
                              >
                                {pct}%
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 rounded-full min-w-[24px] text-center ${
                                  isFiltered
                                    ? "bg-red-500 text-white"
                                    : "bg-red-500/10 text-red-400"
                                }`}
                              >
                                {val}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 3. ALL PROBLEM TYPES Card */}
                <div className="bg-slate-800/40 border border-slate-700 p-5 rounded-2xl shadow-inner flex flex-col max-h-[200px]">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase mb-3 flex items-center gap-2 tracking-widest sticky top-0 bg-slate-800/0 py-1">
                    <AlertTriangle size={14} /> ALL PROBLEM TYPES
                  </h4>
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {getModalSummary(selectedCallDetails.calls).allProb.map(
                      ([name, val, pct], idx) => {
                        const isFiltered =
                          modalActiveFilter.type === "problemType" &&
                          modalActiveFilter.value === name;
                        return (
                          <div
                            key={idx}
                            onClick={() =>
                              handleToggleModalFilter("problemType", name)
                            }
                            className={`flex justify-between items-center border-b border-slate-700/30 pb-1.5 pt-0.5 px-2 rounded-lg cursor-pointer transition-all hover:bg-slate-800 ${
                              isFiltered
                                ? "bg-orange-600/20 border-l-4 border-orange-500 text-orange-300 font-black"
                                : "text-slate-300"
                            }`}
                          >
                            <span className="text-[11px] font-bold truncate max-w-[70%]">
                              {name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[8px] font-bold ${
                                  isFiltered
                                    ? "text-orange-300"
                                    : "text-slate-500"
                                }`}
                              >
                                {pct}%
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 rounded-full min-w-[24px] text-center ${
                                  isFiltered
                                    ? "bg-orange-500 text-white"
                                    : "bg-orange-500/10 text-orange-400"
                                }`}
                              >
                                {val}
                              </span>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* 4. MAX AGE Card */}
                <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-2xl shadow-inner flex flex-col max-h-[200px]">
                  <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} /> Max Equipment Age
                  </h4>
                  <div className="flex-1 flex justify-center items-center py-2">
                    <span className="text-4xl font-black text-white italic drop-shadow-lg">
                      {getModalSummary(selectedCallDetails.calls).maxAge}{" "}
                      <small className="text-sm not-italic opacity-60 ml-1">
                        YEAR
                      </small>
                    </span>
                  </div>
                  <div className="pt-3 border-t border-indigo-500/20 flex items-end justify-between mt-auto">
                    <div>
                      <div className="text-[8px] font-black text-indigo-400 uppercase">
                        Total Counts
                      </div>
                      <div className="text-xl font-black text-white">
                        {sortedModalCalls.length}{" "}
                        <small className="text-[9px] opacity-40 uppercase">
                          {modalActiveFilter.type ? "Filtered" : "Calls"}
                        </small>
                      </div>
                    </div>
                    {modalActiveFilter.type ? (
                      <button
                        onClick={handleClearModalFilter}
                        className="text-[9px] bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded transition-all animate-bounce"
                      >
                        ล้างค่ากรอง
                      </button>
                    ) : (
                      <Activity size={24} className="text-indigo-400/30" />
                    )}
                  </div>
                </div>
              </div>

              {/* Call Details Table */}
              <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                      <tr className="border-b border-slate-700 text-[10px] font-black text-white uppercase tracking-widest bg-slate-950/40">
                        <th className="py-5 px-6">TICKET NO</th>
                        <th
                          className="py-5 px-6 cursor-pointer hover:bg-slate-800 transition-colors"
                          onClick={() => handleModalSort("date")}
                        >
                          <div className="flex items-center gap-2">
                            MONTH / DATE / YEAE
                            {modalSortKey === "date" &&
                              (modalSortDirection === "asc" ? (
                                <ArrowUp size={14} className="text-red-400" />
                              ) : (
                                <ArrowDown size={14} className="text-red-400" />
                              ))}
                            {modalSortKey !== "date" && (
                              <ArrowUpDown size={14} className="opacity-30" />
                            )}
                          </div>
                        </th>
                        <th className="py-5 px-6">PROBLEM TYPE</th>
                        <th className="py-5 px-6">SYSTEM</th>
                        <th className="py-5 px-6">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded">
                            DAMAGED PARTS
                          </span>
                        </th>
                        <th className="py-5 px-6">CAUSE สาเหตุ</th>
                        <th
                          className="py-5 px-6 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                          onClick={() => handleModalSort("age")}
                        >
                          <div className="flex items-center justify-center gap-2">
                            อายุอุปกรณ์
                            {modalSortKey === "age" &&
                              (modalSortDirection === "asc" ? (
                                <ArrowUp
                                  size={14}
                                  className="text-indigo-400"
                                />
                              ) : (
                                <ArrowDown
                                  size={14}
                                  className="text-indigo-400"
                                />
                              ))}
                            {modalSortKey !== "age" && (
                              <ArrowUpDown size={14} className="opacity-30" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 font-sans">
                      {sortedModalCalls.length > 0 ? (
                        sortedModalCalls.map((call, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-800/50 transition-colors group"
                          >
                            <td className="py-5 px-6">
                              <div className="text-sm font-black text-blue-300">
                                {call.ticket_no}
                              </div>
                              <div className="text-[9px] text-white font-bold mt-1 opacity-80">
                                {call.product_type || "N/A"}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-xs font-medium text-white">
                                {call.date}
                              </div>
                              <div className="text-[9px] text-indigo-200 font-black mt-1 uppercase bg-indigo-500/20 inline-block px-2 py-0.5 rounded border border-indigo-500/40">
                                {formatMonthLabel(call.month)}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <span className="px-3 py-1 bg-red-500/20 text-red-300 text-[10px] font-black rounded-lg border border-red-500/30 block text-center truncate max-w-[150px]">
                                {call.problem_type || "-"}
                              </span>
                            </td>
                            <td className="py-5 px-6 text-xs font-bold text-white">
                              {call.system || "-"}
                            </td>
                            <td className="py-5 px-6">
                              <div className="text-[11px] font-black text-white italic leading-relaxed max-w-[180px]">
                                {call.damaged_parts || "-"}
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 text-[10px] text-indigo-100 font-bold leading-relaxed max-w-[200px]">
                                {call.cause || "-"}
                              </div>
                            </td>
                            <td className="py-5 px-6 text-center">
                              <div
                                className={`inline-block px-3 py-1.5 rounded-full border text-[10px] font-black italic whitespace-nowrap ${
                                  parseFloat(call.equipment_age) > 5
                                    ? "bg-red-500/20 text-red-400 border-red-500/40"
                                    : "bg-slate-700 text-white border-slate-500"
                                }`}
                              >
                                {call.equipment_age &&
                                !isNaN(parseFloat(call.equipment_age))
                                  ? `${parseFloat(call.equipment_age)} ปี`
                                  : "-"}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="p-12 text-center text-slate-500 font-bold"
                          >
                            ไม่พบรายการตามตัวกรองที่เลือกในขณะนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-900 border-t border-slate-700 flex justify-end items-center">
              <button
                onClick={() => {
                  setSelectedCallDetails(null);
                  handleClearModalFilter();
                }}
                className="px-12 py-4 bg-white hover:bg-slate-200 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
