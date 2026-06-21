import { StyleSheet, View } from 'react-native';

import { AutoClickPanel } from '@/components/auto-click-panel';
import { DraggableTarget } from '@/components/draggable-target';
import { useAutoClickEngine } from '@/hooks/use-auto-click-engine';

export default function HomeScreen() {
  const engine = useAutoClickEngine();

  return (
    <View style={styles.screen}>
      <AutoClickPanel {...engine} />
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
