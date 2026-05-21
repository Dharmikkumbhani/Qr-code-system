import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, LogBox } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

// Ignore the specific expo-notifications warning in Expo Go
LogBox.ignoreLogs(['expo-notifications: Android Push notifications']);

// Configure how notifications should appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    // Learn more about projectId: https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    try {
      if (Constants.appOwnership === 'expo') {
        console.log('Push notifications are not supported in Expo Go on Android. Skipping push token registration.');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      })).data;
      console.log('Expo Push Token:', token);
      
      // Send token to our backend
      await api.post('/auth/push-token', { pushToken: token });
      console.log('Push token sent to backend successfully');
    } catch (e) {
      console.error('Error fetching/sending push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
