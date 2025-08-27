import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import SplashScreen from '../screens/SplashScreen';

const AppNavigator = () => {
  const { isLoading, userToken, userInfo, logout } = useContext(AuthContext); // ✅ include logout

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {userToken ? (
        <MainStack role={userInfo?.role} logout={logout} />  // ✅ pass logout
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
