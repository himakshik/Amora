import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';

import { supabase } from '../lib/supabase';

export default function SignupScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 850;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /*
   * Clear the signup form whenever the user leaves
   * the Signup screen.
   *
   * This prevents previously entered personal information
   * and password from appearing when the user comes back.
   */
  useFocusEffect(
    useCallback(() => {
      return () => {
        setName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setLoading(false);
        setErrorMessage('');
      };
    }, [])
  );

  const passwordRules = useMemo(
    () => ({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }),
    [password]
  );

  const passwordScore =
    Object.values(passwordRules).filter(Boolean).length;

  const isEmailValid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isFormValid =
    name.trim().length >= 2 &&
    isEmailValid &&
    passwordScore === 5;

  const getPasswordStrength = () => {
    if (!password) return '';

    if (passwordScore <= 2) {
      return 'Needs a little work';
    }

    if (passwordScore <= 4) {
      return 'Almost there';
    }

    return 'Strong password ✨';
  };

  const handleSignup = async () => {
    if (!isFormValid || loading) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.replace('/onboarding');
    } else {
      setErrorMessage(
        'Account created! Please check your email to verify your account.'
      );
    }
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
          <Text style={styles.eyebrow}>
            LET&apos;S MAKE IT PERSONAL
          </Text>

          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
            ]}
          >
            Hey, gorgeous. 👋
          </Text>

          <Text
            style={[
              styles.subtitle,
              compact && styles.subtitleCompact,
            ]}
          >
            Your glow-up starts here.
            {'\n'}
            Let&apos;s create a space that&apos;s all about you.
          </Text>
        </View>

        {/* Progress */}
        <View
          style={[
            styles.progressRow,
            compact && styles.progressRowCompact,
          ]}
        >
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />

          <Text style={styles.progressText}>01 / 03</Text>
        </View>

        {/* Form */}
        <View
          style={[
            styles.form,
            compact && styles.formCompact,
          ]}
        >
          {/* Name */}
          <View
            style={[
              styles.field,
              compact && styles.fieldCompact,
            ]}
          >
            <Text style={styles.label}>
              What should we call you?
            </Text>

            <View
              style={[
                styles.inputWrapper,
                compact && styles.inputWrapperCompact,
              ]}
            >
              <Text style={styles.inputIcon}>♡</Text>

              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#B9A4AD"
                autoCapitalize="words"
                autoCorrect={false}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setErrorMessage('');
                }}
              />
            </View>
          </View>

          {/* Email */}
          <View
            style={[
              styles.field,
              compact && styles.fieldCompact,
            ]}
          >
            <Text style={styles.label}>Your email</Text>

            <View
              style={[
                styles.inputWrapper,
                compact && styles.inputWrapperCompact,
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
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage('');
                }}
              />
            </View>

            {email.length > 0 && !isEmailValid && (
              <Text style={styles.errorText}>
                Hmm, that email doesn&apos;t look right.
              </Text>
            )}
          </View>

          {/* Password */}
          <View
            style={[
              styles.field,
              compact && styles.fieldCompact,
            ]}
          >
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>
                Create a password
              </Text>

              <Text
                style={[
                  styles.passwordStrength,
                  compact &&
                    styles.passwordStrengthCompact,
                  passwordScore === 5 &&
                    styles.passwordStrengthGood,
                ]}
              >
                {getPasswordStrength()}
              </Text>
            </View>

            <View
              style={[
                styles.inputWrapper,
                compact && styles.inputWrapperCompact,
              ]}
            >
              <Text style={styles.inputIcon}>✦</Text>

              <TextInput
                style={styles.input}
                placeholder="Something only you know"
                placeholderTextColor="#B9A4AD"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage('');
                }}
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(!showPassword)
                }
                activeOpacity={0.7}
              >
                <Text style={styles.eyeIcon}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Password requirements */}
            {password.length > 0 && (
              <View
                style={[
                  styles.requirementsCard,
                  compact &&
                    styles.requirementsCardCompact,
                ]}
              >
                <Text
                  style={[
                    styles.requirementsTitle,
                    compact &&
                      styles.requirementsTitleCompact,
                  ]}
                >
                  Your password needs:
                </Text>

                <View style={styles.requirementsGrid}>
                  <PasswordRule
                    valid={passwordRules.length}
                    text="8+ characters"
                  />

                  <PasswordRule
                    valid={passwordRules.uppercase}
                    text="Uppercase A-Z"
                  />

                  <PasswordRule
                    valid={passwordRules.lowercase}
                    text="Lowercase a-z"
                  />

                  <PasswordRule
                    valid={passwordRules.number}
                    text="Number 0-9"
                  />

                  <PasswordRule
                    valid={passwordRules.special}
                    text="Special character"
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Signup error / success message */}
        {errorMessage ? (
          <Text style={styles.signupError}>
            {errorMessage}
          </Text>
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
          onPress={handleSignup}
        >
          <Text style={styles.primaryButtonText}>
            {loading
              ? 'Creating your account...'
              : isFormValid
                ? "Let's do this"
                : 'Complete your details'}
          </Text>

          {!loading && (
            <Text style={styles.arrow}>→</Text>
          )}
        </TouchableOpacity>

        {/* Login */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            compact && styles.loginButtonCompact,
          ]}
          activeOpacity={0.7}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginText}>
            Already part of AMORA?{' '}
            <Text style={styles.loginHighlight}>
              Log in
            </Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text
        style={[
          styles.footer,
          compact && styles.footerCompact,
        ]}
      >
        Your everyday AI wellness companion ✦
      </Text>
    </View>
  );
}

function PasswordRule({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <View style={styles.rule}>
      <View
        style={[
          styles.ruleIcon,
          valid && styles.ruleIconValid,
        ]}
      >
        <Text
          style={[
            styles.ruleCheck,
            valid && styles.ruleCheckValid,
          ]}
        >
          {valid ? '✓' : '○'}
        </Text>
      </View>

      <Text
        style={[
          styles.ruleText,
          valid && styles.ruleTextValid,
        ]}
      >
        {text}
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
    paddingBottom: 8,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
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
    marginTop: 20,
  },

  introCompact: {
    marginTop: 14,
  },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.2,
    color: '#A65A7B',
    marginBottom: 9,
  },

  title: {
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '800',
    color: '#302229',
    letterSpacing: -0.8,
  },

  titleCompact: {
    fontSize: 32,
    lineHeight: 36,
  },

  subtitle: {
    marginTop: 9,
    fontSize: 15,
    lineHeight: 21,
    color: '#79646D',
  },

  subtitleCompact: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
  },

  /* Progress */

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
  },

  progressRowCompact: {
    marginTop: 13,
  },

  progressActive: {
    width: 55,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#9B4F70',
  },

  progressInactive: {
    width: 20,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#E8D6DE',
    marginLeft: 5,
  },

  progressText: {
    marginLeft: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#A18A93',
  },

  /* Form */

  form: {
    marginTop: 14,
  },

  formCompact: {
    marginTop: 10,
  },

  field: {
    marginBottom: 9,
  },

  fieldCompact: {
    marginBottom: 6,
  },

  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },

  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: '#59434D',
  },

  passwordStrength: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A9929B',
    marginBottom: 7,
  },

  passwordStrengthCompact: {
    marginBottom: 6,
  },

  passwordStrengthGood: {
    color: '#4D8665',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9D8DF',
  },

  inputWrapperCompact: {
    height: 48,
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

  eyeIcon: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E4566',
    paddingLeft: 8,
  },

  errorText: {
    marginTop: 5,
    marginLeft: 4,
    fontSize: 11,
    color: '#B45D72',
  },

  /* Password requirements */

  requirementsCard: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: '#FDF1F5',
    borderWidth: 1,
    borderColor: '#F0DDE5',
  },

  requirementsCardCompact: {
    marginTop: 4,
    paddingVertical: 5,
  },

  requirementsTitle: {
    marginBottom: 5,
    fontSize: 11,
    fontWeight: '800',
    color: '#765664',
  },

  requirementsTitleCompact: {
    marginBottom: 3,
  },

  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  rule: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  ruleIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EADCE2',
    marginRight: 6,
  },

  ruleIconValid: {
    backgroundColor: '#DCEDE2',
  },

  ruleCheck: {
    fontSize: 11,
    color: '#9C858E',
  },

  ruleCheckValid: {
    color: '#4D8665',
    fontWeight: '800',
  },

  ruleText: {
    fontSize: 10.5,
    color: '#927C85',
  },

  ruleTextValid: {
    color: '#527461',
    fontWeight: '600',
  },

  /* Error */

  signupError: {
    marginBottom: 10,
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    color: '#B45D72',
    textAlign: 'center',
  },

  /* CTA */

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: 5,
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
    height: 48,
    marginTop: 3,
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

  arrow: {
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },

  /* Login */

  loginButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 5,
  },

  loginButtonCompact: {
    marginTop: 5,
    paddingVertical: 3,
  },

  loginText: {
    color: '#816B74',
    fontSize: 13,
  },

  loginHighlight: {
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

  footerCompact: {
    marginTop: 2,
  },
});