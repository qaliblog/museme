import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AssetsTab } from './components/assets-tab';
import { AgentTab } from './components/agent-tab';
import { MusicAgentTab } from './components/music-agent-tab';
import { SettingsTab } from './components/settings-tab';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#8E8E93',
            headerStyle: {
              backgroundColor: '#F2F2F7',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Tab.Screen
            name="Assets"
            component={AssetsTab}
            options={{
              tabBarLabel: 'Assets',
            }}
          />
          <Tab.Screen
            name="Agent"
            component={AgentTab}
            options={{
              tabBarLabel: 'Agent',
            }}
          />
          <Tab.Screen
            name="Music"
            component={MusicAgentTab}
            options={{
              tabBarLabel: 'Music Agent',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsTab}
            options={{
              tabBarLabel: 'Settings',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
