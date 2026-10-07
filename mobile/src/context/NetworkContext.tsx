import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextType {
  isOnline: boolean;
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextType>({
  isOnline: true,
  checkConnection: async () => true,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const online = Boolean(state.isConnected && (state.isInternetReachable ?? true));
    setIsOnline(online);
    return online;
  };

  return (
    <NetworkContext.Provider value={{ isOnline, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
