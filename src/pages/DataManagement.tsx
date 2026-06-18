import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Coins,
  Flame,
  Award,
  Compass,
  Sprout,
  Bird,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  FileJson,
  Info,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  collectDataSummary,
  createBackupData,
  downloadBackupFile,
  readBackupFile,
  restoreBackupData,
  DataSummary,
  BackupData,
  APP_VERSION,
} from "@/utils/backup";
import { cn } from "@/lib/utils";

export default function DataManagement() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summary, setSummary] = useState<DataSummary>(() => collectDataSummary());
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<BackupData | null>(null);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImport, setPendingImport] = useState<BackupData | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const refreshSummary = () => {
    setSummary(collectDataSummary());
  };

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handlePrepareExport = () => {
    refreshSummary();
    const backup = createBackupData();
    setPendingBackup(backup);
    setShowExportPreview(true);
  };

  const handleConfirmExport = () => {
    if (pendingBackup) {
      downloadBackupFile(pendingBackup);
      setShowExportPreview(false);
      setPendingBackup(null);
      showToast("success", "备份文件已下载到本地～");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const backup = await readBackupFile(file);
      setPendingImport(backup);
      setShowConfirmDialog(true);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "导入失败，请重试"
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmImport = () => {
    if (!pendingImport) return;

    try {
      restoreBackupData(pendingImport);
      refreshSummary();
      setShowConfirmDialog(false);
      setPendingImport(null);
      showToast("success", "数据恢复成功！所有页面已同步更新～");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "恢复失败，请重试"
      );
    }
  };

  const formatExportDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")} ${d
      .getHours()
      .toString()
      .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const summaryItems = [
    {
      icon: Coins,
      label: "当前金币",
      value: summary.coins,
      suffix: "枚",
      color: "text-wheat-500 bg-wheat-50",
    },
    {
      icon: Flame,
      label: "连续签到",
      value: summary.streakDays,
      suffix: "天",
      color: "text-warm-500 bg-warm-50",
    },
    {
      icon: Award,
      label: "安全徽章",
      value: summary.badgeCount,
      suffix: "枚",
      color: "text-sky-500 bg-sky-50",
    },
    {
      icon: Compass,
      label: "图鉴记录",
      value: summary.exploreCount,
      suffix: "条",
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      icon: Sprout,
      label: "种植中的作物",
      value: summary.farmPlotCount,
      suffix: "块",
      color: "text-field-500 bg-field-50",
    },
    {
      icon: Bird,
      label: "信使消息",
      value: summary.messageCount,
      suffix: "条",
      color: "text-rose-500 bg-rose-50",
    },
    {
      icon: Shield,
      label: "已完成安全故事",
      value: summary.completedStories,
      suffix: "个",
      color: "text-violet-500 bg-violet-50",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 relative">
      {toast && (
        <div
          className={cn(
            "fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2",
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-red-500 text-white"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors btn-bounce"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-warm-600">
            数据管理
          </h1>
          <p className="text-sm text-gray-500">备份和恢复你的成长记录</p>
        </div>
      </div>

      <section className="bg-white/70 backdrop-blur-sm rounded-3xl p-5 sm:p-6 shadow-soft mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} className="text-sky-500" />
          <h2 className="font-display text-lg text-gray-700">当前数据概览</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {summaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="bg-white rounded-2xl p-4 border border-gray-100"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                    item.color
                  )}
                >
                  <Icon size={20} />
                </div>
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="font-display text-2xl text-gray-800">
                  {item.value}
                  <span className="text-sm text-gray-500 font-normal ml-1">
                    {item.suffix}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-3xl p-6 shadow-soft border border-sky-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-sky">
              <Download size={24} />
            </div>
            <div>
              <h3 className="font-display text-xl text-sky-700">导出备份</h3>
              <p className="text-sm text-sky-600/70">
                将全部数据保存为文件到本地
              </p>
            </div>
          </div>
          <ul className="text-sm text-sky-700/80 space-y-2 mb-6 bg-white/50 rounded-2xl p-4">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 text-sky-500 shrink-0" />
              <span>包含金币、签到、徽章、图鉴等全部数据</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 text-sky-500 shrink-0" />
              <span>导出前可预览数据摘要</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 text-sky-500 shrink-0" />
              <span>保存为 JSON 文件，请妥善保管</span>
            </li>
          </ul>
          <button
            onClick={handlePrepareExport}
            className="w-full bg-sky-500 text-white py-3.5 rounded-2xl font-medium shadow-sky hover:bg-sky-600 transition-colors flex items-center justify-center gap-2 btn-bounce"
          >
            <Download size={20} />
            立即导出备份
          </button>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-6 shadow-soft border border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-emerald">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="font-display text-xl text-emerald-700">导入恢复</h3>
              <p className="text-sm text-emerald-600/70">
                从备份文件恢复全部数据
              </p>
            </div>
          </div>
          <ul className="text-sm text-emerald-700/80 space-y-2 mb-6 bg-white/50 rounded-2xl p-4">
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 text-emerald-500 shrink-0" />
              <span>自动校验文件格式和版本</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="mt-0.5 text-amber-500 shrink-0"
              />
              <span>导入会覆盖当前所有数据</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={16} className="mt-0.5 text-emerald-500 shrink-0" />
              <span>导入前有二次确认提示</span>
            </li>
          </ul>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className={cn(
              "w-full text-white py-3.5 rounded-2xl font-medium transition-colors flex items-center justify-center gap-2 btn-bounce",
              isProcessing
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 shadow-emerald hover:bg-emerald-600"
            )}
          >
            <Upload size={20} />
            {isProcessing ? "正在读取文件..." : "选择备份文件导入"}
          </button>
        </div>
      </section>

      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 space-y-2">
            <p className="font-medium">温馨提示</p>
            <ul className="space-y-1 list-disc list-inside text-amber-700">
              <li>
                建议定期导出备份，避免更换设备或清理浏览器数据时丢失记录
              </li>
              <li>备份文件请保存在安全的地方，不要随意分享给他人</li>
              <li>
                当前应用版本：<span className="font-mono">v{APP_VERSION}</span>
                ，仅支持导入相同主版本号的备份文件
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-warm-600 hover:text-warm-500 font-medium"
        >
          <ArrowLeft size={18} />
          返回首页
        </Link>
      </div>

      {showExportPreview && pendingBackup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <FileJson size={26} />
                </div>
                <div>
                  <h3 className="font-display text-xl">确认导出备份</h3>
                  <p className="text-sm text-white/80">请确认以下数据摘要</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "金币", value: pendingBackup.summary.coins + " 枚" },
                  {
                    label: "连续签到",
                    value: pendingBackup.summary.streakDays + " 天",
                  },
                  {
                    label: "徽章",
                    value: pendingBackup.summary.badgeCount + " 枚",
                  },
                  {
                    label: "图鉴",
                    value: pendingBackup.summary.exploreCount + " 条",
                  },
                  {
                    label: "作物",
                    value: pendingBackup.summary.farmPlotCount + " 块",
                  },
                  {
                    label: "消息",
                    value: pendingBackup.summary.messageCount + " 条",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-gray-50 rounded-xl p-3"
                  >
                    <div className="text-xs text-gray-500">{item.label}</div>
                    <div className="font-display text-lg text-gray-800">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-sky-50 rounded-xl p-4 mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">导出时间</span>
                  <span className="font-medium text-gray-800">
                    {formatExportDate(pendingBackup.exportedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">应用版本</span>
                  <span className="font-mono font-medium text-gray-800">
                    v{pendingBackup.appVersion}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">文件格式</span>
                  <span className="font-medium text-gray-800">JSON</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowExportPreview(false);
                  setPendingBackup(null);
                }}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmExport}
                className="flex-1 py-3 rounded-2xl bg-sky-500 text-white font-medium shadow-sky hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={18} />
                确认下载
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDialog && pendingImport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <AlertTriangle size={26} />
                </div>
                <div>
                  <h3 className="font-display text-xl">确认导入恢复</h3>
                  <p className="text-sm text-white/80">此操作将覆盖现有数据</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle size={22} className="text-red-500 mt-0.5 shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">数据覆盖警告</p>
                  <p className="text-red-700">
                    导入后，当前的金币、签到、徽章、图鉴、消息等所有数据将被替换为备份文件中的内容，此操作不可撤销！
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">备份时间</span>
                  <span className="font-medium text-gray-800">
                    {formatExportDate(pendingImport.exportedAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">应用版本</span>
                  <span className="font-mono font-medium text-emerald-600">
                    v{pendingImport.appVersion}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">金币</div>
                  <div className="font-display text-lg text-gray-800">
                    {pendingImport.summary.coins} 枚
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">连续签到</div>
                  <div className="font-display text-lg text-gray-800">
                    {pendingImport.summary.streakDays} 天
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">徽章</div>
                  <div className="font-display text-lg text-gray-800">
                    {pendingImport.summary.badgeCount} 枚
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1">图鉴记录</div>
                  <div className="font-display text-lg text-gray-800">
                    {pendingImport.summary.exploreCount} 条
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingImport(null);
                }}
                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                取消导入
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-medium shadow-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                确认覆盖恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
