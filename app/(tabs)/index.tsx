import { Platform, StyleSheet, View } from 'react-native';

import { AutoClickPanel } from '@/components/auto-click-panel';
import { DraggableTarget } from '@/components/draggable-target';
import { PermissionPanel } from '@/components/permission-panel';
import { WebDemoAutoClicker } from '@/components/web-demo-auto-clicker';
import { useAutoClickEngine } from '@/hooks/use-auto-click-engine';

export default function HomeScreen() {
  const engine = useAutoClickEngine();

  if (Platform.OS === 'web') {
    return <WebDemoAutoClicker {...engine} />;
  }

  return (
    <View style={styles.screen}>
      <AutoClickPanel {...engine} />
      <PermissionPanel />
      <DraggableTarget clickPulse={engine.clickCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111',
  },
});
