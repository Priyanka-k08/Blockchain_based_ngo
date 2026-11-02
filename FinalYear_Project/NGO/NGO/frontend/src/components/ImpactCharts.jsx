import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#1f4d3a", "#c46b3a", "#3d6b4f", "#14201b", "#8a5a3b"];

function asNumber(rows, key) {
  return (rows || []).map((row) => ({ ...row, [key]: Number(row[key] || 0) }));
}

export default function ImpactCharts({ data }) {
  const byCause = asNumber(data.byCause, "raised");
  const utilization = asNumber(data.utilization, "total");
  const monthly = asNumber(data.monthly, "total");

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl bg-white p-5 shadow-lift">
        <h2 className="font-display text-2xl">Raised by cause</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={byCause}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cause" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="raised" fill="#1f4d3a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-lift">
        <h2 className="font-display text-2xl">Utilization mix</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={utilization} dataKey="total" nameKey="category" outerRadius={90} label>
                {utilization.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-lift md:col-span-2">
        <h2 className="font-display text-2xl">Monthly gifts</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#c46b3a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
