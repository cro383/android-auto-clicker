import AsyncStorage from '@react-native-async-storage/async-storage';

const TARGET_POSITION_KEY = 'auto-clicker/target-position';

export type TargetPosition = {
  x: number;
  y: number;
};

export async function loadTargetPosition(): Promise<TargetPosition | null> {
  try {
    const raw = await AsyncStorage.getItem(TARGET_POSITION_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as TargetPosition;
    if (
      typeof parsed.x === 'number' &&
      typeof parsed.y === 'number' &&
      Number.isFinite(parsed.x) &&
      Number.isFinite(parsed.y)
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

export async function saveTargetPosition(position: TargetPosition): Promise<void> {
  try {
    await AsyncStorage.setItem(TARGET_POSITION_KEY, JSON.stringify(position));
  } catch {
    // Ignore write failures so dragging still works offline.
  }
}

export function clampTargetPosition(
  position: TargetPosition,
  containerWidth: number,
  containerHeight: number,
  targetSize: number,
): TargetPosition {
  const maxX = Math.max(0, containerWidth - targetSize);
  const maxY = Math.max(0, containerHeight - targetSize);

  return {
    x: Math.max(0, Math.min(Math.round(position.x), maxX)),
    y: Math.max(0, Math.min(Math.round(position.y), maxY)),
  };
}
