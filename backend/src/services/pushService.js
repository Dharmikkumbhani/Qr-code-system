const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  if (!expoPushToken) {
    return;
  }

  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('Push notification response:', result);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

module.exports = {
  sendPushNotification,
};
