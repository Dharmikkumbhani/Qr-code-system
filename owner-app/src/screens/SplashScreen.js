import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Typography, Shadows } from '../theme/designSystem';

/**
 * SplashScreen — shown while AuthContext reads keychain on startup.
 * Has a subtle pulse animation on the logo so it doesn't feel frozen.
 */
const SplashScreen = () => {
  const pulse = useRef(new Animated.Value(0.85)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fade, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    // Continuous gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        {/* Logo */}
        <Animated.View style={[styles.logoRing, { transform: [{ scale: pulse }] }]}>
          <View style={styles.logoInner}>
            <Text style={styles.logoEmoji}>🍽️</Text>
          </View>
        </Animated.View>

        <Text style={styles.brand}>RestaurantOS</Text>
        <Text style={styles.tagline}>OWNER PORTAL</Text>

        {/* Loading dots */}
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => <Dot key={i} delay={i * 200} />)}
        </View>
      </Animated.View>

      <Text style={styles.version}>v1.0</Text>
    </View>
  );
};

/** Single bouncing dot */
const Dot = ({ delay }) => {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(y, { toValue: -6, duration: 350, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0,  duration: 350, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    ).start();
  }, []);
  return <Animated.View style={[styles.dot, { transform: [{ translateY: y }] }]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },

  logoRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    ...Shadows.glow(),
  },
  logoInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 40 },

  brand: {
    color: Colors.textPrimary,
    fontSize: Typography.xxxl,
    fontWeight: Typography.extrabold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 3,
    marginBottom: 40,
  },

  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    opacity: 0.8,
  },

  version: {
    position: 'absolute',
    bottom: 32,
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
});

export default SplashScreen;
