import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/designSystem';

// ─── Animated Input Field ──────────────────────────────────────────────────────
const InputField = ({ label, icon, value, onChangeText, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, Colors.primary],
  });

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>⚠ {error}</Text> : null}
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});

  // Subtle press animation on the button
  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const validate = () => {
    const e = {};
    if (!email.trim())              e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password)                  e.password = 'Password is required';
    else if (password.length < 6)  e.password = 'Min 6 characters';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Incorrect email or password.';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── Brand Header ── */}
        <View style={styles.headerSection}>
          {/* Decorative ring */}
          <View style={styles.ringOuter}>
            <View style={styles.ringInner}>
              <Text style={styles.logoEmoji}>🍽️</Text>
            </View>
          </View>

          <Text style={styles.brandName}>RestaurantOS</Text>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>OWNER PORTAL</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>
            Your restaurant, fully in your hands.
          </Text>
        </View>

        {/* ── Login Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Enter your credentials to continue</Text>

          <InputField
            label="Email Address"
            icon="📧"
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
            error={errors.email}
            placeholder="owner@restaurant.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password — custom so we can add the toggle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, errors.password && { borderColor: Colors.error }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={(v) => { setPassword(v); setErrors(e => ({ ...e, password: '' })); }}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>⚠ {errors.password}</Text> : null}
          </View>

          {/* ── Login Button ── */}
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={1}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.loginBtnText}>Sign In  →</Text>}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider hint */}
          <View style={styles.hintRow}>
            <View style={styles.hintLine} />
            <Text style={styles.hintText}>Authorized personnel only</Text>
            <View style={styles.hintLine} />
          </View>
        </View>

        {/* ── Feature Badges ── */}
        <View style={styles.featureRow}>
          {[
            { icon: '⚡', label: 'Live Orders' },
            { icon: '📊', label: 'Analytics' },
            { icon: '🔔', label: 'Alerts' },
          ].map((f) => (
            <View key={f.label} style={styles.featureBadge}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>RestaurantOS v1.0  ·  © 2025</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 56,
    paddingBottom: 32,
  },

  // Header
  headerSection: { alignItems: 'center', marginBottom: 36 },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    ...Shadows.glow(),
  },
  ringInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji:  { fontSize: 36 },
  brandName: {
    color: Colors.textPrimary,
    fontSize: Typography.xxl,
    fontWeight: Typography.extrabold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  badgeRow: { flexDirection: 'row', marginBottom: 10 },
  badge: {
    backgroundColor: Colors.primaryGlow,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
  },
  headerSub: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    ...Shadows.lg,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  cardSub: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginBottom: 28,
  },

  // Fields
  fieldGroup:   { marginBottom: 18 },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  inputIcon:  { fontSize: 16, marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.md,
  },
  eyeBtn:  { padding: 6 },
  eyeIcon: { fontSize: 16 },
  errorText: {
    color: Colors.error,
    fontSize: Typography.xs,
    marginTop: 5,
    marginLeft: 2,
  },

  // Button
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    ...Shadows.glow(),
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },

  // Divider
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  hintLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  hintText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    letterSpacing: 0.5,
  },

  // Feature badges
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  featureIcon:  { fontSize: 12 },
  featureLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },

  footer: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
  },
});

export default LoginScreen;
