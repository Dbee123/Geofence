import Toast from 'react-native-toast-message';

export const showToast = (type, text1, text2) => {
  Toast.show({
    type,
    text1,
    text2,
  });
};

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.success}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={styles.error}>
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
};

const styles = {
  success: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 20,
  },
  error: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 20,
  },
  text1: {
    color: 'white',
    fontWeight: 'bold',
  },
  text2: {
    color: 'white',
  },
};