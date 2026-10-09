import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 800;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    isEmailValid && password.length > 0;

  const handleLogin = async () => {
    if (!isFormValid || loading) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setErrorMessage(
        'We could not create your session. Please try again.'
      );
      setLoading(false);
      return;
    }

    setLoading(false);

    // Login successful.
    // Replace the login screen so the user cannot
    // press Back and return to the login screen.
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      {/* Decorative background */}
      <View style={styles.blobOne} />
      <View style={styles.blobTwo} />

      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <Text style={styles.brand}>AMORA</Text>
          <Text style={styles.sparkle}>✦</Text>
        </View>

        {/* Intro */}
        <View
          style={[
            styles.intro,
            compact && styles.introCompact,
          ]}
        >
          <Text style={styles.eyebrow}>WELCOME BACK</Text>

          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
            ]}
          >
            Good to see you. ✨
          </Text>

          <Text
            style={[
              styles.subtitle,
              compact && styles.subtitleCompact,
            ]}
          >
            Your wellness space missed you.
            {'\n'}
            Let's pick up where you left off.
          </Text>
        </View>

        {/* Login form */}
        <View
          style={[
            styles.form,
            compact && styles.formCompact,
          ]}
        >
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Your email</Text>

            <View
              style={[
                styles.inputWrapper,
                email.length > 0 &&
                  !isEmailValid &&
                  styles.inputError,
              ]}
            >
              <Text style={styles.inputIcon}>@</Text>

              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#B9A4AD"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                editable={!loading}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
              />
            </View>

            {email.length > 0 && !isEmailValid && (
              <Text style={styles.errorText}>
                Hmm, that email doesn't look right.
              </Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>Your password</Text>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={loading}
                onPress={() =>
                  setShowPassword(!showPassword)
                }
              >
                <Text style={styles.showText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✦</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#B9A4AD"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                value={password}
                editable={!loading}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.forgotButton}
            disabled={loading}
            onPress={() => {
              setErrorMessage(
                'Password reset will be available soon.'
              );
            }}
          >
            <Text style={styles.forgotPassword}>
              Forgot your password?
            </Text>
          </TouchableOpacity>

          {/* Login error */}
          {errorMessage ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorCardText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* CTA */}
          <TouchableOpacity
            style={[
              styles.primaryButton,
              compact && styles.primaryButtonCompact,
              !isFormValid &&
                styles.primaryButtonDisabled,
            ]}
            activeOpacity={isFormValid ? 0.85 : 1}
            disabled={!isFormValid || loading}
            onPress={handleLogin}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text
                  style={[
                    styles.primaryButtonText,
                    styles.loadingText,
                  ]}
                >
                  Logging you in...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {isFormValid
                    ? 'Welcome back'
                    : 'Enter your details'}
                </Text>

                <Text style={styles.arrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Signup */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.signupButton,
            compact && styles.signupButtonCompact,
          ]}
          disabled={loading}
          onPress={() => router.push('/signup')}
        >
          <Text style={styles.signupText}>
            New to AMORA?{' '}
            <Text style={styles.signupHighlight}>
              Create your account
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Your everyday AI wellness companion ✦
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 12,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    justifyContent: 'center',
  },

  /* Decorative background */

  blobOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#F6DCE7',
    top: -100,
    right: -80,
    opacity: 0.7,
  },

  blobTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#EEDCE8',
    bottom: -70,
    left: -60,
    opacity: 0.55,
  },

  /* Brand */

  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  brand: {
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#743D59',
  },

  sparkle: {
    marginLeft: 5,
    marginTop: -3,
    fontSize: 15,
    color: '#B45D83',
  },

  /* Intro */

  intro: {
    marginTop: 30,
  },

  introCompact: {
    marginTop: 18,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: '#A65A7B',
    marginBottom: 10,
  },

  title: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
    color: '#302229',
    letterSpacing: -0.8,
  },

  titleCompact: {
    fontSize: 33,
    lineHeight: 38,
  },

  subtitle: {
    marginTop: 11,
    fontSize: 16,
    lineHeight: 23,
    color: '#79646D',
  },

  subtitleCompact: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
  },

  /* Form */

  form: {
    marginTop: 32,
  },

  formCompact: {
    marginTop: 22,
  },

  field: {
    marginBottom: 15,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#59434D',
  },

  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  showText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E4566',
    marginBottom: 7,
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  inputError: {
    borderColor: '#D88A9F',
  },

  inputIcon: {
    width: 25,
    fontSize: 17,
    color: '#A85478',
    textAlign: 'center',
    marginRight: 8,
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#302229',
    fontSize: 15,
  },

  errorText: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11,
    color: '#B45D72',
  },

  /* Forgot password */

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 14,
  },

  forgotPassword: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E4566',
  },

  /* Login error */

  errorCard: {
    marginBottom: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: '#FDF0F3',
    borderWidth: 1,
    borderColor: '#F1D7DF',
  },

  errorCardText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#A84F67',
    textAlign: 'center',
  },

  /* CTA */

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 19,
    backgroundColor: '#9B4F70',
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 7,
    },
    elevation: 4,
  },

  primaryButtonCompact: {
    height: 50,
  },

  primaryButtonDisabled: {
    backgroundColor: '#D8C2CC',
    shadowOpacity: 0,
    elevation: 0,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  loadingText: {
    marginLeft: 9,
  },

  arrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },

  /* Signup */

  signupButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },

  signupButtonCompact: {
    marginTop: 15,
    paddingVertical: 5,
  },

  signupText: {
    color: '#816B74',
    fontSize: 13,
  },

  signupHighlight: {
    color: '#8E4566',
    fontWeight: '800',
  },

  /* Footer */

  footer: {
    textAlign: 'center',
    fontSize: 10,
    color: '#B39DA6',
    marginTop: 5,
  },
});