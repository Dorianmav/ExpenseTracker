import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { authService } from '@/services/authService';
import { API_BASE_URL } from '@/services/apiConfig';

export default function LoginScreen() {
  const [username, setUsername] = useState(process.env.EXPO_PUBLIC_AUTH_USERNAME ?? 'admin');
  const [password, setPassword] = useState(process.env.EXPO_PUBLIC_AUTH_PASSWORD ?? 'admin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Connexion', 'Renseignez un identifiant et un mot de passe.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Impossible de se connecter';
      setError(`${message}. Vérifiez que le téléphone est sur le même réseau que le PC et que l'API est démarrée.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>{API_BASE_URL}</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Identifiant</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            placeholder="admin"
            style={styles.input}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="admin"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#7f8c8d',
    marginBottom: 24,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
