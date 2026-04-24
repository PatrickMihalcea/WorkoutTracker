import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

interface PortalContextValue {
  setNode: (key: number, node: React.ReactNode | null) => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);
let nextPortalKey = 1;

interface PortalHostProps {
  children: React.ReactNode;
}

export function PortalHost({ children }: PortalHostProps) {
  const [nodes, setNodes] = useState<Record<number, React.ReactNode>>({});

  const contextValue = useMemo<PortalContextValue>(() => ({
    setNode: (key, node) => {
      setNodes((prev) => {
        if (node == null) {
          if (!(key in prev)) return prev;
          const next = { ...prev };
          delete next[key];
          return next;
        }
        if (prev[key] === node) return prev;
        return { ...prev, [key]: node };
      });
    },
  }), []);

  const orderedKeys = useMemo(
    () => Object.keys(nodes).map((k) => Number(k)).sort((a, b) => a - b),
    [nodes],
  );

  return (
    <PortalContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {orderedKeys.map((key) => (
            <React.Fragment key={key}>{nodes[key]}</React.Fragment>
          ))}
        </View>
      </View>
    </PortalContext.Provider>
  );
}

interface PortalProps {
  children: React.ReactNode;
}

export function Portal({ children }: PortalProps) {
  const context = useContext(PortalContext);
  const keyRef = useRef<number>(nextPortalKey++);

  useEffect(() => {
    if (!context) return;
    context.setNode(keyRef.current, children);
    return () => context.setNode(keyRef.current, null);
  }, [context]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!context) return;
    context.setNode(keyRef.current, children);
  }, [children, context]);

  if (!context) return <>{children}</>;
  return null;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

