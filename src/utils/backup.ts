import { useUserStore } from "@/stores/useUserStore";
import { useExploreStore } from "@/stores/useExploreStore";
import { useFarmStore } from "@/stores/useFarmStore";
import { useMessengerStore } from "@/stores/useMessengerStore";
import { useSafetyStore } from "@/stores/useSafetyStore";

export const APP_VERSION = "0.0.0";
export const BACKUP_SCHEMA_VERSION = 1;
export const APP_IDENTIFIER = "guiyan";

export interface DataSummary {
  coins: number;
  streakDays: number;
  badgeCount: number;
  exploreCount: number;
  farmPlotCount: number;
  messageCount: number;
  completedStories: number;
}

export interface BackupData {
  schemaVersion: number;
  appVersion: string;
  appIdentifier: string;
  exportedAt: number;
  summary: DataSummary;
  data: {
    user: ReturnType<typeof useUserStore.getState>;
    exploreItems: ReturnType<typeof useExploreStore.getState>["items"];
    farmPlots: ReturnType<typeof useFarmStore.getState>["plots"];
    messengerMessages: ReturnType<typeof useMessengerStore.getState>["messages"];
    safetyCompletedStories: ReturnType<typeof useSafetyStore.getState>["completedStories"];
  };
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function collectDataSummary(): DataSummary {
  const userState = useUserStore.getState();
  const exploreState = useExploreStore.getState();
  const farmState = useFarmStore.getState();
  const messengerState = useMessengerStore.getState();
  const safetyState = useSafetyStore.getState();

  return {
    coins: userState.coins,
    streakDays: userState.streakDays,
    badgeCount: userState.safetyBadges.length,
    exploreCount: exploreState.items.length,
    farmPlotCount: farmState.plots.filter((p) => p.crop !== null).length,
    messageCount: messengerState.messages.length,
    completedStories: safetyState.completedStories.length,
  };
}

export function createBackupData(): BackupData {
  const userState = useUserStore.getState();
  const exploreState = useExploreStore.getState();
  const farmState = useFarmStore.getState();
  const messengerState = useMessengerStore.getState();
  const safetyState = useSafetyStore.getState();

  const summary = collectDataSummary();

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    appIdentifier: APP_IDENTIFIER,
    exportedAt: Date.now(),
    summary,
    data: {
      user: { ...userState },
      exploreItems: [...exploreState.items],
      farmPlots: [...farmState.plots],
      messengerMessages: [...messengerState.messages],
      safetyCompletedStories: [...safetyState.completedStories],
    },
  };
}

export function validateBackupData(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, error: "文件格式不正确，不是有效的备份文件" };
  }

  const obj = raw as Record<string, unknown>;

  if (obj.appIdentifier !== APP_IDENTIFIER) {
    return { valid: false, error: "该文件不属于本应用，无法导入" };
  }

  if (typeof obj.schemaVersion !== "number") {
    return { valid: false, error: "文件缺少版本信息" };
  }

  if (obj.schemaVersion > BACKUP_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `备份文件版本过新（schema v${obj.schemaVersion}），请升级应用后再导入`,
    };
  }

  if (typeof obj.appVersion !== "string") {
    return { valid: false, error: "文件缺少应用版本信息" };
  }

  const fileMajor = obj.appVersion.split(".")[0];
  const appMajor = APP_VERSION.split(".")[0];
  if (fileMajor !== appMajor) {
    return {
      valid: false,
      error: `版本不兼容：备份来自 v${obj.appVersion}，当前应用为 v${APP_VERSION}`,
    };
  }

  if (!obj.data || typeof obj.data !== "object") {
    return { valid: false, error: "备份文件内容损坏" };
  }

  const data = obj.data as Record<string, unknown>;
  const requiredKeys = [
    "user",
    "exploreItems",
    "farmPlots",
    "messengerMessages",
    "safetyCompletedStories",
  ];
  for (const key of requiredKeys) {
    if (!(key in data)) {
      return { valid: false, error: `备份文件缺少 ${key} 数据` };
    }
  }

  return { valid: true };
}

export function restoreBackupData(backup: BackupData): void {
  const { data } = backup;

  const { user: userData } = data;

  const persistUser = {
    nickname: userData.nickname,
    avatar: userData.avatar,
    coins: userData.coins,
    mood: userData.mood,
    streakDays: userData.streakDays,
    lastSignDate: userData.lastSignDate,
    safetyBadges: userData.safetyBadges,
  };

  useUserStore.setState({
    ...persistUser,
  });

  localStorage.setItem(
    "guiyan_user",
    JSON.stringify(persistUser)
  );

  useExploreStore.setState({ items: [...data.exploreItems] });
  localStorage.setItem(
    "guiyan_explore_items",
    JSON.stringify(data.exploreItems)
  );

  useFarmStore.setState({ plots: [...data.farmPlots] });
  localStorage.setItem(
    "guiyan_farm_plots",
    JSON.stringify(data.farmPlots)
  );

  useMessengerStore.setState({ messages: [...data.messengerMessages] });
  localStorage.setItem(
    "guiyan_messenger_messages",
    JSON.stringify(data.messengerMessages)
  );

  useSafetyStore.setState({
    completedStories: [...data.safetyCompletedStories],
  });
}

export function downloadBackupFile(backup: BackupData): void {
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const date = new Date(backup.exportedAt);
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
  const fileName = `guiyan_backup_${dateStr}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const validation = validateBackupData(parsed);
        if (validation.valid === false) {
          reject(new Error(validation.error));
          return;
        }
        resolve(parsed as BackupData);
      } catch (err) {
        if (err instanceof SyntaxError) {
          reject(new Error("文件格式错误，无法解析 JSON"));
        } else if (err instanceof Error) {
          reject(err);
        } else {
          reject(new Error("读取文件时发生未知错误"));
        }
      }
    };
    reader.onerror = () => {
      reject(new Error("读取文件失败"));
    };
    reader.readAsText(file);
  });
}
