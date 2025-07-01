"use client";
import { useEffect, useState } from "react";
import { Button, Table, Input, Select, DatePicker, Spin, message } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

// Types
interface FinanceEntry {
  id: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: number;
  description: string;
  date: string;
  createdBy?: { name: string };
}

const categoryOptions = [
  { value: "rehoming", label: "Rehoming" },
  { value: "store", label: "Store Sales" },
  { value: "donation", label: "Donation" },
  { value: "vet", label: "Vet" },
  { value: "food", label: "Food" },
  { value: "supplies", label: "Supplies" },
  { value: "staff", label: "Staff" },
  { value: "rent", label: "Rent" },
  { value: "other", label: "Other" },
];

export default function FinanceDashboard() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: undefined as "INCOME" | "EXPENSE" | undefined,
    category: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
    search: "",
  });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.category) params.append("category", filters.category);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      const res = await fetch(`/api/finance?${params.toString()}`);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) {
      message.error("Failed to load finance entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line
  }, [filters]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.category) params.append("category", filters.category);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);
      const res = await fetch(`/api/finance/export?${params.toString()}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-entries-${dayjs().format("YYYYMMDD-HHmmss")}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      message.error("Failed to export CSV");
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date", key: "date", render: (d: string) => dayjs(d).format("YYYY-MM-DD") },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: (a: number) => `₱${a.toLocaleString()}` },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Created By", dataIndex: ["createdBy", "name"], key: "createdBy", render: (name: string) => name || "-" },
  ];

  // Summary calculations
  const totalIncome = entries.filter((e: FinanceEntry) => e.type === "INCOME").reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = entries.filter((e: FinanceEntry) => e.type === "EXPENSE").reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Finance Management</h1>
      <div className="flex flex-wrap gap-4 mb-4">
        <Select
          allowClear
          placeholder="Type"
          style={{ width: 120 }}
          value={filters.type}
          onChange={(type: "INCOME" | "EXPENSE" | undefined) => setFilters(f => ({ ...f, type }))}
          options={[{ value: "INCOME", label: "Income" }, { value: "EXPENSE", label: "Expense" }]}
        />
        <Select
          allowClear
          placeholder="Category"
          style={{ width: 150 }}
          value={filters.category}
          onChange={(category: string | undefined) => setFilters(f => ({ ...f, category }))}
          options={categoryOptions}
        />
        <DatePicker.RangePicker
          onChange={(dates: RangePickerProps['value']) => setFilters(f => ({
            ...f,
            startDate: dates?.[0]?.format("YYYY-MM-DD"),
            endDate: dates?.[1]?.format("YYYY-MM-DD"),
          }))}
        />
        <Input.Search
          placeholder="Search description..."
          style={{ width: 200 }}
          value={filters.search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchEntries} />
        <Button icon={<DownloadOutlined />} onClick={handleExport} type="primary">Export CSV</Button>
      </div>
      <div className="mb-4 flex gap-8">
        <div>
          <div className="text-lg font-semibold">Total Income</div>
          <div className="text-green-600 text-xl font-bold">₱{totalIncome.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-lg font-semibold">Total Expenses</div>
          <div className="text-red-600 text-xl font-bold">₱{totalExpense.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-lg font-semibold">Net Profit</div>
          <div className="text-blue-600 text-xl font-bold">₱{netProfit.toLocaleString()}</div>
        </div>
      </div>
      <Spin spinning={loading} tip="Loading entries...">
        <Table
          columns={columns}
          dataSource={entries}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Spin>
    </div>
  );
} 