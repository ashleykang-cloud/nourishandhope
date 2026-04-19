const ComponentFunction = function() {
  // @section:imports @depends:[]
  const React = require('react');
  const { useState, useEffect, useContext, useMemo, useCallback, useRef, createContext } = React;
  const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';
  const SUPABASE_URL = 'https://eulgfuusfxcuahmddond.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1bGdmdXVzZnhjdWFobWRkb25kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NDk3MTksImV4cCI6MjA5MTAyNTcxOX0.IcYbfNjG1btJnAtQU8mzKY9-2euKViexr6bnbrNea6I';
  const { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, StatusBar, ActivityIndicator, KeyboardAvoidingView, FlatList, Linking } = require('react-native');
  const { MaterialIcons } = require('@expo/vector-icons');
  const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
  const { useNavigation } = require('@react-navigation/native');
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const { useQuery, useMutation } = require('platform-hooks');
  // @end:imports

  // Layout constants
  var TAB_MENU_HEIGHT = Platform.OS === 'web' ? 56 : 49;
  var SCROLL_EXTRA_PADDING = 16;
  var WEB_TAB_MENU_PADDING = 90;
  var FAB_SPACING = 16;

  // @section:theme @depends:[]
  const storageStrategy = 'all-local';
  const UserRoleContext = createContext(null);
  const AuthContext = createContext(null);
  const AuthProvider = function(props) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [savedRole, setSavedRole] = useState(null);
    const [initialized, setInitialized] = useState(false);

    const signup = function(email, password, role) {
      setAuthLoading(true);
      return fetch(SUPABASE_URL + '/auth/v1/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error_description || data.error);
        if (data.user && data.access_token) {
          return fetch(SUPABASE_URL + '/rest/v1/profiles', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + data.access_token,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify({ id: data.user.id, role: role })
          })
          .then(function() {
            setUser(data.user);
            setToken(data.access_token);
            setSavedRole(role);
            setAuthLoading(false);
            return Object.assign({}, data, { role: role });
          });
        }
        setAuthLoading(false);
        return data;
      })
      .catch(function(err) {
        setAuthLoading(false);
        throw err;
      });
    };

    const login = function(email, password) {
      setAuthLoading(true);
      return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email: email, password: password })
      })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.error) throw new Error(data.error_description || data.error);
        if (data.user && data.access_token) {
          return fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + data.user.id + '&select=role', {
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': 'Bearer ' + data.access_token
            }
          })
          .then(function(r) { return r.json(); })
          .then(function(profiles) {
            var role = profiles && profiles[0] ? profiles[0].role : 'parent';
            setUser(data.user);
            setToken(data.access_token);
            setSavedRole(role);
            setAuthLoading(false);
            return Object.assign({}, data, { role: role });
          });
        }
        setAuthLoading(false);
        return data;
      })
      .catch(function(err) {
        setAuthLoading(false);
        throw err;
      });
    };

    const logout = function() {
      setUser(null);
      setToken(null);
    };

    return React.createElement(AuthContext.Provider, { testID: 'Provider-1', value: { user, token, authLoading, signup, login, logout, initialized, savedRole, setSavedRole }
    }, props.children);
  };

  const useAuth = function() { return useContext(AuthContext); };
  const primaryColor = '#5C7A5F';
  const accentColor = '#E8836A';
  const backgroundColor = '#FAF7F2';
  const cardColor = '#FFFFFF';
  const textPrimary = '#2D3748';
  const textSecondary = '#718096';
  const designStyle = 'modern';
  // @end:theme

  // @section:navigation-setup @depends:[]
  const Tab = createBottomTabNavigator();
  const UserRoleProvider = function(props) {
    const [userRole, setUserRole] = useState(null);
    return React.createElement(UserRoleContext.Provider, { testID: 'Provider-1', value: { userRole: userRole, setUserRole: setUserRole } }, props.children);
  };
  const useUserRole = function() { return useContext(UserRoleContext); };
  // @end:navigation-setup

  // @section:ThemeContext @depends:[theme]
  const ThemeContext = React.createContext({
    theme: { colors: { primary: primaryColor, accent: accentColor, background: backgroundColor, card: cardColor, textPrimary: textPrimary, textSecondary: textSecondary, border: '#E5E7EB', success: '#10B981', error: '#EF4444', warning: '#F59E0B' } },
    darkMode: false,
    toggleDarkMode: function() {},
    designStyle: designStyle,
  });
  const ThemeProvider = function(props) {
    const [darkMode, setDarkMode] = useState(false);
    const lightTheme = useMemo(function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: backgroundColor,
          card: cardColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
          border: '#E5E7EB',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    }, []);
    const darkTheme = useMemo(function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: '#1F2937',
          card: '#374151',
          textPrimary: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#4B5563',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    }, []);
    const theme = darkMode ? darkTheme : lightTheme;
    const toggleDarkMode = useCallback(function() {
      setDarkMode(function(prev) { return !prev; });
    }, []);
    const value = useMemo(function() {
      return { theme: theme, darkMode: darkMode, toggleDarkMode: toggleDarkMode, designStyle: designStyle };
    }, [theme, darkMode, toggleDarkMode]);
    return React.createElement(ThemeContext.Provider, { testID: 'Provider-1', value: value }, props.children);
  };
  const useTheme = function() { return useContext(ThemeContext); };
  // @end:ThemeContext

  // @section:HomeScreen @depends:[ThemeContext,styles]
  const HomeScreen = function() {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING);
    var scrollTopPadding = insets.top;

    const handleCallCrisis = function() {
      if (Platform.OS === 'web') {
        window.open('tel:18666621235');
      } else {
        Linking.openURL('tel:18666621235');
      }
    };

    return React.createElement(ScrollView, { testID: 'ScrollView-1', style: { flex: 1, backgroundColor: theme.colors.background },
      contentContainerStyle: { paddingTop: scrollTopPadding, paddingBottom: scrollBottomPadding }
    },
      React.createElement(View, { testID: 'View-1', style: styles.crisisBanner, componentId: 'crisis-banner' },
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-1', name: 'phone', size: 20, color: '#FFFFFF' }),
        React.createElement(Text, { testID: 'Text-1', style: styles.crisisText, componentId: 'crisis-text' }, 'Crisis Support: 1-866-662-1235'),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-1', style: styles.crisisCallButton,
          onPress: handleCallCrisis,
          componentId: 'crisis-call-button'
        },
          React.createElement(Text, { testID: 'Text-2', style: styles.crisisButtonText, componentId: 'crisis-button-text' }, 'Call Now')
        )
      ),
      React.createElement(View, { testID: 'View-2', style: styles.welcomeSection, componentId: 'welcome-section' },
        React.createElement(Text, { testID: 'Text-3', style: [styles.appTitle, { color: theme.colors.textPrimary }], componentId: 'app-title' }, 'Nourish & Hope'),
        React.createElement(Text, { testID: 'Text-4', style: [styles.welcomeText, { color: theme.colors.textSecondary }], componentId: 'welcome-text' }, 
          'A compassionate space for families navigating eating disorders. You are not alone on this journey.'
        )
      ),
      React.createElement(View, { testID: 'View-3', style: styles.mainButtons, componentId: 'main-buttons' },
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-2', style: [styles.mainButton, { backgroundColor: theme.colors.primary }],
          onPress: function() {
            navigation.navigate('Parents');
          },
          componentId: 'parents-button'
        },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-2', name: 'family-restroom', size: 32, color: '#FFFFFF' }),
          React.createElement(Text, { testID: 'Text-5', style: styles.mainButtonText, componentId: 'parents-button-text' }, 'For Parents'),
          React.createElement(Text, { testID: 'Text-6', style: styles.mainButtonSubtext, componentId: 'parents-button-subtext' }, 'Guidance & Support')
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-3', style: [styles.mainButton, { backgroundColor: theme.colors.accent }],
          onPress: function() {
            navigation.navigate('Teens');
          },
          componentId: 'teens-button'
        },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-3', name: 'sentiment-very-satisfied', size: 32, color: '#FFFFFF' }),
          React.createElement(Text, { testID: 'Text-7', style: styles.mainButtonText, componentId: 'teens-button-text' }, 'For Kids & Teens'),
          React.createElement(Text, { testID: 'Text-8', style: styles.mainButtonSubtext, componentId: 'teens-button-subtext' }, 'Hope & Recovery')
        )
      ),
      React.createElement(View, { testID: 'View-4', style: styles.quickLinks, componentId: 'quick-links' },
        React.createElement(Text, { testID: 'Text-9', style: [styles.quickLinksTitle, { color: theme.colors.textPrimary }], componentId: 'quick-links-title' }, 'Quick Access'),
        React.createElement(View, { testID: 'View-5', style: styles.quickLinksRow, componentId: 'quick-links-row' },
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-4', style: [styles.quickLinkCard, { backgroundColor: theme.colors.card }], componentId: 'quick-link-chat',
          onPress: function() { navigation.navigate('AI Chat'); } },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-4', name: 'chat', size: 24, color: theme.colors.primary }),
            React.createElement(Text, { testID: 'Text-10', style: [styles.quickLinkText, { color: theme.colors.textPrimary }], componentId: 'quick-link-chat-text' }, 'AI Chat')
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-5', style: [styles.quickLinkCard, { backgroundColor: theme.colors.card }], componentId: 'quick-link-learn',
          onPress: function() { navigation.navigate('Learn'); } },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-5', name: 'school', size: 24, color: theme.colors.primary }),
            React.createElement(Text, { testID: 'Text-11', style: [styles.quickLinkText, { color: theme.colors.textPrimary }], componentId: 'quick-link-learn-text' }, 'Learn More')
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-6', style: [styles.quickLinkCard, { backgroundColor: theme.colors.card }], componentId: 'quick-link-help',
          onPress: function() { navigation.navigate('Get Help'); } },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-6', name: 'help', size: 24, color: theme.colors.primary }),
            React.createElement(Text, { testID: 'Text-12', style: [styles.quickLinkText, { color: theme.colors.textPrimary }], componentId: 'quick-link-help-text' }, 'Get Help')
          )
        )
      )
    );
  };
  // @end:HomeScreen

  // @section:ParentsScreen @depends:[ThemeContext,styles]
  const ParentsScreen = function() {
    const navigation = useNavigation();
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING);
    var scrollTopPadding = insets.top;

    const warningSigns = [
      'Significant weight loss or weight fluctuations',
      'Preoccupation with body weight, food, calories, or dieting',
      'Avoiding family meals or social events with food',
      'Mood swings, anxiety, or depression around meals',
      'Excessive exercise or compensatory behaviors',
      'Physical symptoms like fatigue, dizziness, or feeling cold'
    ];

    const communicationTips = [
      'Choose a calm, private moment to talk',
      'Use "I" statements to express your concerns',
      'Listen without judgment and validate their feelings',
      'Avoid comments about weight, food, or appearance',
      'Focus on health and well-being, not weight',
      'Be patient - recovery is a process'
    ];

    return React.createElement(ScrollView, { testID: 'ScrollView-2', style: { flex: 1, backgroundColor: theme.colors.background },
      contentContainerStyle: { paddingTop: scrollTopPadding, paddingBottom: scrollBottomPadding }
    },
      React.createElement(View, { testID: 'View-6', style: styles.screenHeader, componentId: 'parents-header' },
        React.createElement(Text, { testID: 'Text-13', style: [styles.screenTitle, { color: theme.colors.textPrimary }], componentId: 'parents-title' }, 'For Parents'),
        React.createElement(Text, { testID: 'Text-14', style: [styles.screenSubtitle, { color: theme.colors.textSecondary }], componentId: 'parents-subtitle' }, 
          'Supporting your child through recovery'
        )
      ),
      React.createElement(View, { testID: 'View-7', style: [styles.infoCard, { backgroundColor: theme.colors.card }], componentId: 'warning-signs-card' },
        React.createElement(View, { testID: 'View-8', style: styles.cardHeader, componentId: 'warning-signs-header' },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-7', name: 'warning', size: 24, color: theme.colors.accent }),
          React.createElement(Text, { testID: 'Text-15', style: [styles.cardTitle, { color: theme.colors.textPrimary }], componentId: 'warning-signs-title' }, 'Warning Signs')
        ),
        React.createElement(View, { testID: 'View-9', style: styles.cardContent, componentId: 'warning-signs-content' },
          warningSigns.map(function(sign, index) {
            return React.createElement(View, { testID: 'View-10', key: index, style: styles.bulletPoint, componentId: 'warning-sign-' + index },
              React.createElement(View, { testID: 'View-11', style: [styles.bullet, { backgroundColor: theme.colors.accent }], componentId: 'bullet-' + index }),
              React.createElement(Text, { testID: 'Text-16', style: [styles.bulletText, { color: theme.colors.textPrimary }], componentId: 'warning-text-' + index }, sign)
            );
          })
        )
      ),
      React.createElement(View, { testID: 'View-12', style: [styles.infoCard, { backgroundColor: theme.colors.card }], componentId: 'communication-card' },
        React.createElement(View, { testID: 'View-13', style: styles.cardHeader, componentId: 'communication-header' },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-8', name: 'forum', size: 24, color: theme.colors.primary }),
          React.createElement(Text, { testID: 'Text-17', style: [styles.cardTitle, { color: theme.colors.textPrimary }], componentId: 'communication-title' }, 'How to Talk to Your Child')
        ),
        React.createElement(View, { testID: 'View-14', style: styles.cardContent, componentId: 'communication-content' },
          communicationTips.map(function(tip, index) {
            return React.createElement(View, { testID: 'View-15', key: index, style: styles.bulletPoint, componentId: 'communication-tip-' + index },
              React.createElement(View, { testID: 'View-16', style: [styles.bullet, { backgroundColor: theme.colors.primary }], componentId: 'tip-bullet-' + index }),
              React.createElement(Text, { testID: 'Text-18', style: [styles.bulletText, { color: theme.colors.textPrimary }], componentId: 'tip-text-' + index }, tip)
            );
          })
        )
      ),
      React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-7', style: [styles.aiChatButton, { backgroundColor: theme.colors.accent }],
        onPress: function() { navigation.navigate('AI Chat'); },
        componentId: 'ai-chat-button'
      },
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-9', name: 'chat', size: 24, color: '#FFFFFF' }),
        React.createElement(Text, { testID: 'Text-19', style: styles.aiChatButtonText, componentId: 'ai-chat-button-text' }, 'Chat with Hope AI Support'),
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-10', name: 'arrow-forward', size: 20, color: '#FFFFFF' })
      )
    );
  };
  // @end:ParentsScreen

  // @section:TeensScreen @depends:[ThemeContext,styles]
  const TeensScreen = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING);
    var scrollTopPadding = insets.top;

    const faqItems = [
      {
        question: 'What are eating disorders?',
        answer: 'Eating disorders are serious mental health conditions that affect how you think about food and your body. They are not a choice or a phase.'
      },
      {
        question: 'Is recovery possible?',
        answer: 'Yes! With proper support and treatment, full recovery from eating disorders is absolutely possible. Many people go on to live healthy, fulfilling lives.'
      },
      {
        question: 'How can I get help?',
        answer: 'Start by talking to a trusted adult, your doctor, or calling a helpline. You deserve support and you are worth recovery.'
      }
    ];

    const recoveryStories = [
      {
        name: 'Sarah, age 19',
        story: 'Recovery taught me that my worth isn\'t determined by a number on a scale. Today I can enjoy meals with friends and focus on my dreams.'
      },
      {
        name: 'Alex, age 17',
        story: 'I learned that asking for help was brave, not weak. My therapist helped me find healthy ways to cope with stress and emotions.'
      },
      {
        name: 'Maya, age 20',
        story: 'Recovery is a journey with ups and downs, but every small step forward counts. I\'m proud of how far I\'ve come.'
      }
    ];

    return React.createElement(ScrollView, { testID: 'ScrollView-3', style: { flex: 1, backgroundColor: theme.colors.background },
      contentContainerStyle: { paddingTop: scrollTopPadding, paddingBottom: scrollBottomPadding }
    },
      React.createElement(View, { testID: 'View-17', style: styles.screenHeader, componentId: 'teens-header' },
        React.createElement(Text, { testID: 'Text-20', style: [styles.screenTitle, { color: theme.colors.textPrimary }], componentId: 'teens-title' }, 'For Kids & Teens'),
        React.createElement(Text, { testID: 'Text-21', style: [styles.screenSubtitle, { color: theme.colors.textSecondary }], componentId: 'teens-subtitle' }, 
          'You are not alone. Recovery is possible.'
        )
      ),
      React.createElement(View, { testID: 'View-18', style: [styles.reassuranceCard, { backgroundColor: theme.colors.accent }], componentId: 'reassurance-card' },
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-11', name: 'favorite', size: 32, color: '#FFFFFF' }),
        React.createElement(Text, { testID: 'Text-22', style: styles.reassuranceTitle, componentId: 'reassurance-title' }, 'You Are Valued'),
        React.createElement(Text, { testID: 'Text-23', style: styles.reassuranceText, componentId: 'reassurance-text' }, 
          'Your life has meaning beyond food, weight, or appearance. You deserve love, support, and happiness just as you are.'
        )
      ),
      React.createElement(View, { testID: 'View-19', style: [styles.infoCard, { backgroundColor: theme.colors.card }], componentId: 'faq-card' },
        React.createElement(View, { testID: 'View-20', style: styles.cardHeader, componentId: 'faq-header' },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-12', name: 'help-outline', size: 24, color: theme.colors.primary }),
          React.createElement(Text, { testID: 'Text-24', style: [styles.cardTitle, { color: theme.colors.textPrimary }], componentId: 'faq-title' }, 'Frequently Asked Questions')
        ),
        React.createElement(View, { testID: 'View-21', style: styles.cardContent, componentId: 'faq-content' },
          faqItems.map(function(item, index) {
            return React.createElement(View, { testID: 'View-22', key: index, style: styles.faqItem, componentId: 'faq-item-' + index },
              React.createElement(Text, { testID: 'Text-25', style: [styles.faqQuestion, { color: theme.colors.textPrimary }], componentId: 'faq-question-' + index }, item.question),
              React.createElement(Text, { testID: 'Text-26', style: [styles.faqAnswer, { color: theme.colors.textSecondary }], componentId: 'faq-answer-' + index }, item.answer)
            );
          })
        )
      ),
      React.createElement(View, { testID: 'View-23', style: [styles.infoCard, { backgroundColor: theme.colors.card }], componentId: 'stories-card' },
        React.createElement(View, { testID: 'View-24', style: styles.cardHeader, componentId: 'stories-header' },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-13', name: 'star', size: 24, color: theme.colors.accent }),
          React.createElement(Text, { testID: 'Text-27', style: [styles.cardTitle, { color: theme.colors.textPrimary }], componentId: 'stories-title' }, 'Recovery Stories')
        ),
        React.createElement(View, { testID: 'View-25', style: styles.cardContent, componentId: 'stories-content' },
          recoveryStories.map(function(story, index) {
            return React.createElement(View, { testID: 'View-26', key: index, style: styles.storyItem, componentId: 'story-item-' + index },
              React.createElement(Text, { testID: 'Text-28', style: [styles.storyName, { color: theme.colors.accent }], componentId: 'story-name-' + index }, story.name),
              React.createElement(Text, { testID: 'Text-29', style: [styles.storyText, { color: theme.colors.textPrimary }], componentId: 'story-text-' + index }, story.story)
            );
          })
        )
      )
    );
  };
  // @end:TeensScreen

  // @section:ChatScreen-state @depends:[ThemeContext]
  const useChatState = function() {
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const { data: messages, loading, refetch } = useQuery('chat_messages', {}, { column: 'timestamp', ascending: true });
    const { mutate: insertMessage } = useMutation('chat_messages', 'insert');
    const [currentMessage, setCurrentMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const [cleared, setCleared] = useState(false);
    const [localMessages, setLocalMessages] = useState([]);    
    const flatListRef = useRef(null);

    useEffect(function() {
      if (!initialized && messages && messages.length === 0) {
        var welcomeMessage = {
          id: 'welcome-' + Date.now(),
          message: 'Hi, I\'m Hope — a supportive AI assistant for parents and families navigating eating disorders. What\'s on your mind today?',
          isUser: false,
          timestamp: new Date().toISOString()
        };
        insertMessage(welcomeMessage)
          .then(function() {
            setInitialized(true);
            refetch();
          })
          .catch(function(error) {
            console.error('Error inserting welcome message:', error);
            setInitialized(true);
          });
      } else if (messages && messages.length > 0 && !initialized) {
        setInitialized(true);
      }
    }, [messages, initialized, insertMessage, refetch]);

    useEffect(function() {
      setTimeout(function() {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }, [messages]);

    return {
      theme: theme,
      messages: messages || [],
      loading: loading,
      refetch: refetch,
      insertMessage: insertMessage,
      currentMessage: currentMessage,
      setCurrentMessage: setCurrentMessage,
      isTyping: isTyping,
      setIsTyping: setIsTyping,
      flatListRef: flatListRef,
      localMessages: localMessages,
      setLocalMessages: setLocalMessages
    };
  };
  // @end:ChatScreen-state

  // @section:ChatScreen-handlers @depends:[ChatScreen-state]
  const chatHandlers = {
    sendMessage: function(state) {
      if (!state.currentMessage.trim()) return;
      
      const userMessage = {
        id: Date.now().toString(),
        message: state.currentMessage.trim(),
        isUser: true,
        timestamp: new Date().toISOString()
      };

      state.insertMessage(userMessage)
        .then(function() {
          state.setCurrentMessage('');
          state.setIsTyping(true);
          state.refetch();
          
          chatHandlers.callClaudeAPI(userMessage.message)
            .then(function(aiResponse) {
              const aiMessage = {
                id: (Date.now() + 1).toString(),
                message: aiResponse,
                isUser: false,
                timestamp: new Date().toISOString()
              };
              
              state.insertMessage(aiMessage)
                .then(function() {
                  state.setIsTyping(false);
                  state.refetch();
                  setTimeout(function() {
                    if (state.flatListRef.current) {
                      state.flatListRef.current.scrollToEnd({ animated: true });
                    }
                  }, 100);
                })
                .catch(function(error) {
                  state.setIsTyping(false);
                  Platform.OS === 'web' ? window.alert('Error: ' + error.message) : Alert.alert('Error', error.message);
                });
            })
            .catch(function(error) {
              state.setIsTyping(false);
              var fallbackResponse = 'I\'m having trouble connecting right now, but know that your concerns are valid. Please consider reaching out to a professional therapist or our helpline at 1-866-662-1235 for immediate support.';
              var aiMessage = {
                id: (Date.now() + 1).toString(),
                message: fallbackResponse,
                isUser: false,
                timestamp: new Date().toISOString()
              };
              state.insertMessage(aiMessage)
                .then(function() {
                  state.refetch();
                  setTimeout(function() {
                    if (state.flatListRef.current) {
                      state.flatListRef.current.scrollToEnd({ animated: true });
                    }
                  }, 100);
                })
                .catch(function(innerError) {
                  Platform.OS === 'web' ? window.alert('Error: ' + innerError.message) : Alert.alert('Error', innerError.message);
                });
            });
        })
        .catch(function(error) {
          Platform.OS === 'web' ? window.alert('Error: ' + error.message) : Alert.alert('Error', error.message);
        });
    },

    callClaudeAPI: function(userMessage) {
      return new Promise(function(resolve, reject) {
        var requestBody = {
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: 'You are Hope, a warm and compassionate AI support assistant for parents of children with eating disorders. Provide emotional support and practical guidance. Keep responses to 3 paragraphs maximum. Never provide medical diagnoses. Always recommend professional help for serious concerns. If there is immediate danger direct them to call 911 or 1-866-662-1235.',
          messages: [
            {
              role: 'user',
              content: userMessage
            }
          ]
        };

        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        })
          .then(function(response) {
            if (!response.ok) {
              throw new Error('API request failed with status ' + response.status);
            }
            return response.json();
          })
          .then(function(data) {
            if (data.content && data.content.length > 0 && data.content[0].text) {
              resolve(data.content[0].text);
            } else {
              reject(new Error('No response from Claude API'));
            }
          })
          .catch(function(error) {
            reject(error);
          });
      });
    }
  };
  // @end:ChatScreen-handlers

  // @section:ChatScreen @depends:[ChatScreen-state,ChatScreen-handlers,styles]
  const ChatScreen = function() {
    const state = useChatState();
    const handlers = chatHandlers;
    const insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : (SCROLL_EXTRA_PADDING);
    var scrollTopPadding = insets.top;

    const renderMessage = function(item, index) {
      const isUser = item.isUser;
      return React.createElement(View, { testID: 'View-27', key: item.id,
        style: [styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage],
        componentId: 'message-' + index
      },
        React.createElement(View, { testID: 'View-28', style: [styles.messageBubble, {
            backgroundColor: isUser ? state.theme.colors.primary : state.theme.colors.card,
            alignSelf: isUser ? 'flex-end' : 'flex-start'
          }],
          componentId: 'message-bubble-' + index
        },
          React.createElement(Text, { testID: 'Text-30', style: [styles.messageText, { color: isUser ? '#FFFFFF' : state.theme.colors.textPrimary }],
            componentId: 'message-text-' + index
          }, item.message)
        )
      );
    };

    if (state.loading) {
      return React.createElement(View, { testID: 'View-29', style: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: state.theme.colors.background } },
        React.createElement(ActivityIndicator, { testID: 'ActivityIndicator-1', style: { flex: 1 }, componentId: 'loading' })
      );
    }

    return React.createElement(KeyboardAvoidingView, { testID: 'KeyboardAvoidingView-1', style: { flex: 1, backgroundColor: state.theme.colors.background },
      behavior: Platform.OS === 'ios' ? 'padding' : (Platform.OS === 'web' ? undefined : 'height'),
      componentId: 'chat-keyboard-avoiding'
    },
      React.createElement(View, { testID: 'View-30', style: styles.screenHeader, componentId: 'chat-header' },
        React.createElement(View, { testID: 'View-31', style: styles.screenHeaderTop },
          React.createElement(Text, { testID: 'Text-31', style: [styles.screenTitle, { color: state.theme.colors.textPrimary }], componentId: 'chat-title' }, 'Hope AI Support'),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-8', style: [styles.clearChatButton, { backgroundColor: state.theme.colors.primary }],
            onPress: function() {
              Alert.alert('Clear Chat History', 'Are you sure you want to clear all messages?', [
                { text: 'Cancel', onPress: function() {}, style: 'cancel' },
                { text: 'Clear', onPress: function() {
                  var welcomeMessage = {
                    id: 'welcome-' + Date.now(),
                    message: 'Hi, I\'m Hope — a supportive AI assistant for parents and families navigating eating disorders. What\'s on your mind today?',
                    isUser: false,
                    timestamp: new Date().toISOString()
                  };
                  state.setLocalMessages([welcomeMessage]);
                  state.setCurrentMessage('');
                  state.setIsTyping(false);
                }, style: 'destructive' }
              ]);
            },
            componentId: 'clear-chat-button'
          },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-14', name: 'delete-outline', size: 20, color: '#FFFFFF' })
          )
        ),
        React.createElement(Text, { testID: 'Text-32', style: [styles.screenSubtitle, { color: state.theme.colors.textSecondary }], componentId: 'chat-subtitle' }, 
          'A supportive space for your questions'
        )
      ),
      React.createElement(FlatList, { testID: 'FlatList-1', ref: state.flatListRef,
        data: state.localMessages.length > 0 ? state.localMessages : state.messages,
        renderItem: function(data) { return renderMessage(data.item, data.index); },
        keyExtractor: function(item) { return item.id; },
        style: { flex: 1 },
        contentContainerStyle: { paddingTop: scrollTopPadding + 60, paddingBottom: 200, paddingHorizontal: 16 },
        onContentSizeChange: function() {
          if (state.flatListRef.current) {
            state.flatListRef.current.scrollToEnd({ animated: true });
          }
        },
        componentId: 'chat-messages-list'
      }),
      state.isTyping ? React.createElement(View, { testID: 'View-32', style: styles.typingIndicator, componentId: 'typing-indicator' },
        React.createElement(Text, { testID: 'Text-33', style: [styles.typingText, { color: state.theme.colors.textSecondary }], componentId: 'typing-text' }, 'Hope AI is typing...'),
        React.createElement(ActivityIndicator, { testID: 'ActivityIndicator-2', size: 'small', color: state.theme.colors.primary, componentId: 'typing-spinner' })
      ) : null,
      React.createElement(View, { testID: 'View-33', style: [styles.chatInputContainer, { backgroundColor: state.theme.colors.card, paddingBottom: insets.bottom + 16, marginBottom: TAB_MENU_HEIGHT }], componentId: 'chat-input-container' },
        React.createElement(TextInput, { testID: 'TextInput-1', style: [styles.chatInput, { color: state.theme.colors.textPrimary, borderColor: state.theme.colors.border }],
          value: state.currentMessage,
          onChangeText: state.setCurrentMessage,
          placeholder: 'Type your message...',
          placeholderTextColor: state.theme.colors.textSecondary,
          multiline: true,
          maxLength: 500,
          editable: !state.isTyping,
          componentId: 'chat-input'
        }),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-9', style: [styles.sendButton, { backgroundColor: accentColor, opacity: !state.currentMessage.trim() || state.isTyping ? 0.5 : 1 }],
          onPress: function() { handlers.sendMessage(state); },
          disabled: !state.currentMessage.trim() || state.isTyping,
          componentId: 'send-button'
        },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-15', name: 'send', size: 24, color: '#FFFFFF' })
        )
      )
    );
  };
  // @end:ChatScreen

// @section:UnderstandingScreen @depends:[ThemeContext,styles]
const UnderstandingScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState('types');

  const sections = [
    { key: 'types', label: 'ED Types' },
    { key: 'myths', label: 'Myths' },
    { key: 'therapies', label: 'Therapies' },
    { key: 'recovery', label: 'Recovery' }
  ];

  const disorderTypes = [
    {
      name: 'Anorexia Nervosa',
      icon: 'trending-down',
      color: '#E8836A',
      description: 'Characterized by restriction of food intake, leading to significantly low body weight.',
      symptoms: ['Extreme weight loss', 'Intense fear of gaining weight', 'Distorted body image', 'Restricted eating patterns']
    },
    {
      name: 'Bulimia Nervosa',
      icon: 'refresh',
      color: '#6A9BB8',
      description: 'Involves cycles of binge eating followed by compensatory behaviors.',
      symptoms: ['Binge eating episodes', 'Compensatory behaviors', 'Normal or above-normal weight', 'Shame around eating habits']
    },
    {
      name: 'Binge Eating Disorder',
      icon: 'loop',
      color: '#9B6AB0',
      description: 'Recurrent episodes of eating large amounts with a feeling of loss of control — without purging.',
      symptoms: ['Eating large amounts rapidly', 'Feeling out of control', 'Eating when not hungry', 'Intense shame afterwards']
    },
    {
      name: 'ARFID',
      icon: 'block',
      color: '#5C7A5F',
      description: 'Avoidant/Restrictive Food Intake Disorder — limited food intake not related to body image.',
      symptoms: ['Limited food variety', 'Sensory sensitivities', 'Lack of interest in food', 'Nutritional deficiencies']
    },
    {
      name: 'Orthorexia',
      icon: 'eco',
      color: '#BA7517',
      description: 'An obsession with eating "purely" or "healthily" that becomes extreme and interferes with daily life.',
      symptoms: ['Rigid food rules', 'Anxiety around "impure" foods', 'Social isolation around eating', 'Disguised as health consciousness']
    },
    {
      name: 'OSFED',
      icon: 'category',
      color: '#888780',
      description: 'Other Specified Feeding or Eating Disorder — the most common diagnosis. Just as serious as other EDs.',
      symptoms: ['Does not fit neatly into other categories', 'Causes significant distress', 'Affects daily functioning', 'Deserves the same level of care']
    }
  ];

  const myths = [
    {
      myth: 'Eating disorders only affect thin teenage girls',
      fact: 'Eating disorders affect people of ALL genders, ages, races, and body sizes. Someone can be in a larger body and still have a serious eating disorder.',
      color: '#E8836A'
    },
    {
      myth: 'It\'s just a phase — they\'ll grow out of it',
      fact: 'Eating disorders are serious mental health conditions that rarely resolve on their own. Early professional treatment leads to dramatically better outcomes.',
      color: '#6A9BB8'
    },
    {
      myth: 'Parents cause eating disorders',
      fact: 'Eating disorders have complex genetic, biological, and environmental causes. No single person or parenting style causes them. Family involvement is actually key to recovery.',
      color: '#5C7A5F'
    },
    {
      myth: 'If they\'re eating, they can\'t have an eating disorder',
      fact: 'Many eating disorders — bulimia, binge eating disorder, ARFID — involve eating. The disorder is in the relationship with food, not just the amount consumed.',
      color: '#9B6AB0'
    },
    {
      myth: 'They could just eat normally if they wanted to',
      fact: 'Eating disorders involve real changes in brain chemistry. Willpower cannot fix them, just as willpower cannot fix a broken bone or diabetes.',
      color: '#BA7517'
    },
    {
      myth: 'Eating disorders are not that serious',
      fact: 'Eating disorders have the highest mortality rate of any mental health condition. Early intervention is critical and can be life-saving.',
      color: '#DC2626'
    },
    {
      myth: 'Only people who are underweight need treatment',
      fact: 'Medical complications from eating disorders can occur at any weight. Weight alone is never a reliable indicator of the severity of an eating disorder.',
      color: '#E8836A'
    },
    {
      myth: 'Recovery means eating normally again',
      fact: 'Full recovery means freedom from obsessive thoughts about food and body, restored physical health, and a peaceful relationship with eating — not just compliance with meal plans.',
      color: '#5C7A5F'
    }
  ];

  const therapies = [
    {
      name: 'Family-Based Treatment (FBT)',
      abbr: 'FBT',
      color: '#5C7A5F',
      bgColor: '#EBF2EC',
      bestFor: 'Adolescents with anorexia or bulimia',
      desc: 'The gold standard treatment for adolescent eating disorders. Parents take an active role in refeeding their child and restoring healthy eating patterns. Treatment happens in three phases: weight restoration, returning control to the adolescent, and establishing healthy identity.',
      keyPoints: [
        'Parents are the most important resource — not the cause',
        'Typically 15-20 sessions over 6-12 months',
        'Has the strongest evidence base for adolescents',
        'Whole family participates in therapy sessions'
      ]
    },
    {
      name: 'Cognitive Behavioral Therapy',
      abbr: 'CBT',
      color: '#6A9BB8',
      bgColor: '#EAF3F9',
      bestFor: 'Bulimia, binge eating disorder, adults with anorexia',
      desc: 'CBT helps identify and change the distorted thoughts and beliefs that drive eating disorder behaviours. It teaches practical skills to interrupt the binge-purge cycle, challenge body image distortions, and develop healthier coping strategies.',
      keyPoints: [
        'Focuses on the connection between thoughts, feelings, and behaviours',
        'Usually 20 sessions over 5 months',
        'Strong evidence base for bulimia and BED',
        'Teaches practical skills that last beyond therapy'
      ]
    },
    {
      name: 'Dialectical Behavior Therapy',
      abbr: 'DBT',
      color: '#9B6AB0',
      bgColor: '#EEEDFE',
      bestFor: 'Binge eating, emotional dysregulation, self-harm alongside ED',
      desc: 'DBT combines cognitive-behavioral techniques with mindfulness and acceptance strategies. It is particularly helpful when eating disorder behaviours are used to cope with intense emotions, trauma, or difficult relationships.',
      keyPoints: [
        'Four skill areas: mindfulness, distress tolerance, emotion regulation, interpersonal effectiveness',
        'Especially helpful for emotionally intense presentations',
        'Includes both individual therapy and skills groups',
        'Teaches how to tolerate distress without turning to ED behaviours'
      ]
    },
    {
      name: 'Acceptance & Commitment Therapy',
      abbr: 'ACT',
      color: '#BA7517',
      bgColor: '#FAEEDA',
      bestFor: 'Any ED type, especially with anxiety or perfectionism',
      desc: 'ACT focuses on accepting difficult thoughts and feelings rather than fighting them, while committing to actions that align with personal values. It helps people build a rich and meaningful life alongside — and eventually beyond — their eating disorder.',
      keyPoints: [
        'Does not try to eliminate negative thoughts — teaches how to hold them differently',
        'Values-based approach — what matters most to you?',
        'Builds psychological flexibility',
        'Growing evidence base for eating disorders'
      ]
    },
    {
      name: 'Exposure and Response Prevention',
      abbr: 'ERP',
      color: '#E8836A',
      bgColor: '#FDF0EC',
      bestFor: 'ARFID, food phobias, OCD-like ED presentations',
      desc: 'ERP involves gradual, supported exposure to feared foods or situations while resisting the urge to engage in avoidance behaviours. It is the most effective approach for ARFID and for eating disorders with strong anxiety or OCD components.',
      keyPoints: [
        'Works by gradually reducing fear responses to food',
        'Pace is always controlled and collaborative',
        'Never forces eating — builds tolerance slowly',
        'Often combined with FBT or CBT'
      ]
    }
  ];

  const recoveryStages = [
    {
      stage: 'Stage 1',
      title: 'Acknowledgment',
      color: '#E8836A',
      desc: 'Recognising that something is wrong and that help is needed. This can take time and often involves denial first. Even partial acknowledgment is enough to start.'
    },
    {
      stage: 'Stage 2',
      title: 'Getting help',
      color: '#BA7517',
      desc: 'Seeking professional assessment and beginning treatment. This includes medical evaluation, connecting with a therapist and dietitian, and establishing a treatment team.'
    },
    {
      stage: 'Stage 3',
      title: 'Early recovery',
      color: '#6A9BB8',
      desc: 'Physical stabilisation and beginning to challenge eating disorder behaviours. This stage is often the hardest — expect resistance, setbacks, and difficult emotions. Progress is rarely linear.'
    },
    {
      stage: 'Stage 4',
      title: 'Active recovery',
      color: '#9B6AB0',
      desc: 'Working through the underlying thoughts, feelings, and patterns that drive the eating disorder. Developing new coping skills, rebuilding identity, and reconnecting with life beyond the ED.'
    },
    {
      stage: 'Stage 5',
      title: 'Maintenance',
      color: '#5C7A5F',
      desc: 'Managing triggers, preventing relapse, and consolidating gains. Recovery becomes more stable but requires ongoing attention. Many people benefit from ongoing therapy at reduced frequency.'
    },
    {
      stage: 'Stage 6',
      title: 'Full recovery',
      color: '#5C7A5F',
      desc: 'Freedom from eating disorder thoughts and behaviours. Eating without constant fear or guilt. Feeling at home in your body. Living a full life. This is achievable — and it happens for thousands of people every year.'
    }
  ];

  const recoveryFacts = [
    { icon: '📈', text: 'Studies show 50-70% of people with eating disorders achieve full recovery with proper treatment' },
    { icon: '⏰', text: 'Recovery takes time — on average 4-7 years, though many recover much faster with early intervention' },
    { icon: '↩️', text: 'Relapse is common and does not mean failure — it is a normal part of the recovery journey' },
    { icon: '👨‍👩‍👧', text: 'Family involvement improves outcomes by up to 3x for adolescents with eating disorders' },
    { icon: '🧠', text: 'The brain physically changes during recovery — hunger signals, reward pathways, and thought patterns all gradually normalise' }
  ];

  return React.createElement(View, { testID: 'View-34', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-4', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-35', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-34', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Understanding EDs'),
        React.createElement(Text, { testID: 'Text-35', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Knowledge is the first step toward healing')
      ),

      React.createElement(View, { testID: 'View-36', style: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: theme.colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.colors.border }
      },
        sections.map(function(section) {
          var isActive = activeSection === section.key;
          return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-10', key: section.key,
            style: {
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: isActive ? '#5C7A5F' : 'transparent'
            },
            onPress: function() { setActiveSection(section.key); }
          },
            React.createElement(Text, { testID: 'Text-36', style: { fontSize: 12, fontWeight: '500', color: isActive ? '#fff' : theme.colors.textSecondary }
            }, section.label)
          );
        })
      ),

      activeSection === 'types' ?
        React.createElement(View, { testID: 'View-37', style: { paddingHorizontal: 20 } },
          disorderTypes.map(function(disorder, index) {
            return React.createElement(View, { testID: 'View-38', key: index,
              style: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 4, borderLeftColor: disorder.color }
            },
              React.createElement(View, { testID: 'View-39', style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 } },
                React.createElement(MaterialIcons, { testID: 'MaterialIcons-16', name: disorder.icon, size: 24, color: disorder.color }),
                React.createElement(Text, { testID: 'Text-37', style: { fontSize: 17, fontWeight: '600', color: theme.colors.textPrimary, flex: 1 } }, disorder.name)
              ),
              React.createElement(Text, { testID: 'Text-38', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 12 } }, disorder.description),
              React.createElement(Text, { testID: 'Text-39', style: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 } }, 'Common Signs:'),
              disorder.symptoms.map(function(symptom, sIndex) {
                return React.createElement(View, { testID: 'View-40', key: sIndex, style: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 } },
                  React.createElement(View, { testID: 'View-41', style: { width: 6, height: 6, borderRadius: 3, backgroundColor: disorder.color, marginTop: 7, marginRight: 10, flexShrink: 0 } }),
                  React.createElement(Text, { testID: 'Text-40', style: { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 22, flex: 1 } }, symptom)
                );
              })
            );
          }),
          React.createElement(View, { testID: 'View-42', style: { backgroundColor: '#FDF0EC', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F4B5A2' }
          },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-17', name: 'info', size: 20, color: '#E8836A' }),
            React.createElement(Text, { testID: 'Text-41', style: { fontSize: 14, color: '#5A5750', lineHeight: 22, marginTop: 8 } },
              'Only qualified healthcare professionals can diagnose eating disorders. If you\'re concerned about your child, please seek professional assessment.'
            )
          )
        )
      : activeSection === 'myths' ?
        React.createElement(View, { testID: 'View-43', style: { paddingHorizontal: 20 } },
          React.createElement(Text, { testID: 'Text-42', style: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 22 } },
            'Eating disorders are widely misunderstood. These myths can prevent people from seeking help. Here\'s the truth.'
          ),
          myths.map(function(item, index) {
            return React.createElement(View, { testID: 'View-44', key: index,
              style: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }
            },
              React.createElement(View, { testID: 'View-45', style: { backgroundColor: '#FCEBEB', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 } },
                React.createElement(Text, { testID: 'Text-43', style: { fontSize: 14, fontWeight: '600', color: '#A32D2D' } }, '✗ MYTH:'),
                React.createElement(Text, { testID: 'Text-44', style: { fontSize: 14, color: '#A32D2D', lineHeight: 22, flex: 1, fontStyle: 'italic' } }, item.myth)
              ),
              React.createElement(View, { testID: 'View-46', style: { backgroundColor: '#EBF2EC', padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 } },
                React.createElement(Text, { testID: 'Text-45', style: { fontSize: 14, fontWeight: '600', color: '#3B5E3D' } }, '✓ FACT:'),
                React.createElement(Text, { testID: 'Text-46', style: { fontSize: 14, color: '#3B5E3D', lineHeight: 22, flex: 1 } }, item.fact)
              )
            );
          })
        )
      : activeSection === 'therapies' ?
        React.createElement(View, { testID: 'View-47', style: { paddingHorizontal: 20 } },
          React.createElement(Text, { testID: 'Text-47', style: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 22 } },
            'Understanding the main evidence-based therapies helps you ask the right questions and advocate for the best treatment for your child.'
          ),
          therapies.map(function(therapy, index) {
            return React.createElement(View, { testID: 'View-48', key: index,
              style: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }
            },
              React.createElement(View, { testID: 'View-49', style: { backgroundColor: therapy.bgColor, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 } },
                React.createElement(View, { testID: 'View-50', style: { backgroundColor: therapy.color, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }
                },
                  React.createElement(Text, { testID: 'Text-48', style: { color: '#fff', fontSize: 13, fontWeight: '700' } }, therapy.abbr)
                ),
                React.createElement(View, { testID: 'View-51', style: { flex: 1 } },
                  React.createElement(Text, { testID: 'Text-49', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 } }, therapy.name),
                  React.createElement(Text, { testID: 'Text-50', style: { fontSize: 12, color: therapy.color, fontWeight: '500' } }, 'Best for: ' + therapy.bestFor)
                )
              ),
              React.createElement(View, { testID: 'View-52', style: { padding: 16 } },
                React.createElement(Text, { testID: 'Text-51', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: 14 } }, therapy.desc),
                therapy.keyPoints.map(function(point, pIndex) {
                  return React.createElement(View, { testID: 'View-53', key: pIndex, style: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 } },
                    React.createElement(View, { testID: 'View-54', style: { width: 6, height: 6, borderRadius: 3, backgroundColor: therapy.color, marginTop: 7, marginRight: 10, flexShrink: 0 } }),
                    React.createElement(Text, { testID: 'Text-52', style: { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 22, flex: 1 } }, point)
                  );
                })
              )
            );
          }),
          React.createElement(View, { testID: 'View-55', style: { backgroundColor: '#EAF3F9', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#9EC4DA' }
          },
            React.createElement(Text, { testID: 'Text-53', style: { fontSize: 15, fontWeight: '600', color: '#185FA5', marginBottom: 8 } }, '💡 Questions to ask a potential therapist'),
            React.createElement(Text, { testID: 'Text-54', style: { fontSize: 14, color: '#5A5750', lineHeight: 24 } },
              '• "What eating disorder treatments do you specialise in?"\n• "Are you trained in FBT or CBT-E?"\n• "How many eating disorder patients do you currently treat?"\n• "How do you involve families in treatment?"\n• "What does a typical treatment plan look like?"'
            ),
            React.createElement(View, { testID: 'View-56', style: { marginBottom: 20 } },
              React.createElement(Text, { testID: 'Text-55', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 } }, '🎬 Educational videos'),
              [
                { title: 'Family-Based Treatment (FBT) overview', url: 'https://www.youtube.com/results?search_query=family+based+treatment+FBT+eating+disorder', desc: 'Educational videos on the gold standard adolescent ED treatment' },
                { title: 'CBT for eating disorders', url: 'https://www.youtube.com/results?search_query=CBT+cognitive+behavioral+therapy+eating+disorder', desc: 'How cognitive behavioral therapy works for EDs' },
                { title: 'DBT skills for ED recovery', url: 'https://www.youtube.com/results?search_query=DBT+dialectical+behavior+therapy+eating+disorder', desc: 'How DBT helps with emotional regulation in recovery' },
                { title: 'Understanding ARFID', url: 'https://www.youtube.com/results?search_query=ARFID+avoidant+restrictive+food+intake+disorder', desc: 'Educational videos on ARFID for families' },
                { title: 'ACT therapy explained', url: 'https://www.youtube.com/results?search_query=ACT+acceptance+commitment+therapy+eating+disorder', desc: 'Acceptance and commitment therapy for eating disorders' }
              ].map(function(video, index) {
                return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-11', key: index,
                  style: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
                  onPress: function() { Linking.openURL(video.url); }
                },
                  React.createElement(View, { testID: 'View-57', style: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EAF3F9', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                    React.createElement(MaterialIcons, { testID: 'MaterialIcons-18', name: 'play-circle-outline', size: 24, color: '#6A9BB8' })
                  ),
                  React.createElement(View, { testID: 'View-58', style: { flex: 1 } },
                    React.createElement(Text, { testID: 'Text-56', style: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 } }, video.title),
                    React.createElement(Text, { testID: 'Text-57', style: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 } }, video.desc)
                  ),
                  React.createElement(MaterialIcons, { testID: 'MaterialIcons-19', name: 'arrow-forward-ios', size: 14, color: theme.colors.textSecondary })
                );
              })
            ),            
          )
        )
      :
        React.createElement(View, { testID: 'View-56', style: { paddingHorizontal: 20 } },
          React.createElement(Text, { testID: 'Text-55', style: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 22 } },
            'Recovery is real. It is not always fast or straight — but it happens for thousands of people every year.'
          ),
          recoveryStages.map(function(stage, index) {
            return React.createElement(View, { testID: 'View-57', key: index, style: { flexDirection: 'row', marginBottom: 16, gap: 14 } },
              React.createElement(View, { testID: 'View-58', style: { alignItems: 'center' } },
                React.createElement(View, { testID: 'View-59', style: { width: 44, height: 44, borderRadius: 22, backgroundColor: stage.color, alignItems: 'center', justifyContent: 'center' }
                },
                  React.createElement(Text, { testID: 'Text-56', style: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' } }, stage.stage)
                ),
                index < recoveryStages.length - 1 ?
                  React.createElement(View, { testID: 'View-60', style: { width: 2, flex: 1, backgroundColor: '#EDE8DF', marginVertical: 4 } }) : null
              ),
              React.createElement(View, { testID: 'View-61', style: { flex: 1, backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 0 }
              },
                React.createElement(Text, { testID: 'Text-57', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 6 } }, stage.title),
                React.createElement(Text, { testID: 'Text-58', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 } }, stage.desc)
              )
            );
          }),
          React.createElement(View, { testID: 'View-62', style: { backgroundColor: '#EBF2EC', borderRadius: 16, padding: 20, marginTop: 4, marginBottom: 16, borderWidth: 1, borderColor: '#A8C4AA' }
          },
            React.createElement(Text, { testID: 'Text-59', style: { fontSize: 16, fontWeight: '600', color: '#3B5E3D', marginBottom: 14 } }, '📊 Recovery facts'),
            recoveryFacts.map(function(fact, index) {
              return React.createElement(View, { testID: 'View-63', key: index, style: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 10 } },
                React.createElement(Text, { testID: 'Text-60', style: { fontSize: 18 } }, fact.icon),
                React.createElement(Text, { testID: 'Text-61', style: { fontSize: 14, color: '#3B5E3D', lineHeight: 22, flex: 1 } }, fact.text)
              );
            })
          ),
          React.createElement(View, { testID: 'View-64', style: { backgroundColor: '#5C7A5F', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center' }
          },
            React.createElement(Text, { testID: 'Text-62', style: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'Recovery is possible'),
            React.createElement(Text, { testID: 'Text-63', style: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 } },
              'With the right support, at the right time, your child can recover. Many people who felt completely trapped have gone on to live full, free, joyful lives.'
            )
          )
        )
    )
  );
};
// @end:UnderstandingScreen

  // @section:GetHelpScreen @depends:[ThemeContext,styles]
const GetHelpScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { setUserRole, userRole } = useUserRole();
  const isKid = userRole === 'kid';

  const helpResources = [
    {
      title: 'Alliance for Eating Disorders Awareness',
      description: 'Comprehensive resources and support for families',
      action: 'Visit Website',
      url: 'https://www.allianceforeatingdisorders.com'
    },
    {
      title: 'Find a Therapist',
      description: 'Locate eating disorder specialists in your area',
      action: 'Search Now',
      url: 'https://www.psychologytoday.com/us/therapists/eating-disorders'
    },
    {
      title: 'Family Support Groups',
      description: 'Connect with other families on similar journeys',
      action: 'Find Groups',
      url: 'https://www.allianceforeatingdisorders.com/get-help/support-groups'
    },
    {
      title: 'Treatment Centers',
      description: 'Find specialized eating disorder treatment facilities',
      action: 'Locate Centers',
      url: 'https://www.eatingdisorderhope.com/treatment-for-eating-disorders'
    }
  ];

  const clinicResources = [
    { icon: '🔍', name: 'Psychology Today Therapist Finder', desc: 'Search for eating disorder specialists by location, insurance, and age group.', url: 'https://www.psychologytoday.com/us/therapists/eating-disorders' },
    { icon: '🏥', name: 'Eating Disorder Hope Treatment Finder', desc: 'Find residential programs, intensive outpatient, and treatment centers.', url: 'https://www.eatingdisorderhope.com/treatment-for-eating-disorders' },
    { icon: '🥗', name: 'Find an ED-Specialised Dietitian', desc: 'Search for registered dietitians who specialise in eating disorder recovery.', url: 'https://www.eatright.org/find-a-nutrition-expert' },
    { icon: '🏫', name: 'FEAST Family Support', desc: 'Families Empowered and Supporting Treatment of Eating Disorders.', url: 'https://www.feast-ed.org' }
  ];

  if (isKid) {
    return React.createElement(View, { testID: 'View-68', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
    },
      React.createElement(ScrollView, { testID: 'ScrollView-5', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
      },
        React.createElement(View, { testID: 'View-69', style: { padding: 20, paddingBottom: 8 } },
          React.createElement(Text, { testID: 'Text-67', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Get Help'),
          React.createElement(Text, { testID: 'Text-68', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'You don\'t have to face this alone')
        ),

        React.createElement(View, { testID: 'View-70', style: { backgroundColor: '#E8836A', borderRadius: 16, margin: 20, marginTop: 8, padding: 24, alignItems: 'center' } },
          React.createElement(Text, { testID: 'Text-69', style: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' } }, '💙 Need to talk right now?'),
          React.createElement(Text, { testID: 'Text-70', style: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
            'You are not alone. A real person is ready to listen — no judgment, completely confidential.'
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-12', style: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 40, marginBottom: 12, width: '100%', alignItems: 'center' },
            onPress: function() { Linking.openURL('tel:18666621235'); }
          },
            React.createElement(Text, { testID: 'Text-71', style: { color: '#E8836A', fontSize: 16, fontWeight: '700' } }, 'Call 1-866-662-1235')
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-13', style: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 40, width: '100%', alignItems: 'center' },
            onPress: function() { Linking.openURL('sms:741741&body=HOME'); }
          },
            React.createElement(Text, { testID: 'Text-72', style: { color: '#fff', fontSize: 16, fontWeight: '600' } }, 'Text HOME to 741741')
          )
        ),

        React.createElement(View, { testID: 'View-71', style: { backgroundColor: theme.colors.card, borderRadius: 16, marginHorizontal: 20, marginBottom: 20, padding: 20, borderWidth: 1, borderColor: theme.colors.border } },
          React.createElement(Text, { testID: 'Text-73', style: { fontSize: 17, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 16 } }, '💚 Other ways to get support'),
          [
            { icon: '🏫', title: 'Talk to your school counselor', desc: 'Your school counselor is trained to help and everything you share is confidential.' },
            { icon: '👨‍👩‍👧', title: 'Tell a trusted adult', desc: 'A parent, teacher, or family member you trust can help you find the right support.' },
            { icon: '👩‍⚕️', title: 'See your doctor', desc: 'Your family doctor can refer you to a specialist who understands eating disorders.' }
          ].map(function(item, index) {
            return React.createElement(View, { testID: 'View-72', key: index,
              style: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 12 }
            },
              React.createElement(Text, { testID: 'Text-74', style: { fontSize: 22, flexShrink: 0 } }, item.icon),
              React.createElement(View, { testID: 'View-73', style: { flex: 1 } },
                React.createElement(Text, { testID: 'Text-75', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, item.title),
                React.createElement(Text, { testID: 'Text-76', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 } }, item.desc)
              )
            );
          })
        ),

        React.createElement(View, { testID: 'View-74', style: { backgroundColor: '#EBF2EC', borderRadius: 16, marginHorizontal: 20, marginBottom: 20, padding: 20, borderWidth: 1, borderColor: '#A8C4AA' }
        },
          React.createElement(Text, { testID: 'Text-77', style: { fontSize: 16, fontWeight: '600', color: '#3B5E3D', marginBottom: 8, textAlign: 'center' } }, 'You are not alone 💚'),
          React.createElement(Text, { testID: 'Text-78', style: { fontSize: 14, color: '#5A5750', textAlign: 'center', lineHeight: 22 } },
            'Many young people have felt exactly what you are feeling right now — and they have found their way through. Recovery is real and it is possible for you.'
          )
        ),

        React.createElement(View, { testID: 'View-75', style: { marginHorizontal: 20, marginBottom: 20 } },
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-14', style: { backgroundColor: theme.colors.card, paddingVertical: 14, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
            onPress: function() { logout(); setUserRole(null); }
          },
            React.createElement(Text, { testID: 'Text-79', style: { color: theme.colors.textSecondary, fontSize: 14 } }, 'Log out')
          )
        )
      )
    );
  }

  return React.createElement(View, { testID: 'View-76', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-6', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-77', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-80', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Get Help'),
        React.createElement(Text, { testID: 'Text-81', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'You are not alone in this journey')
      ),

      React.createElement(View, { testID: 'View-78', style: { backgroundColor: '#E8836A', borderRadius: 16, margin: 20, marginTop: 8, padding: 24, alignItems: 'center' }
      },
        React.createElement(Text, { testID: 'Text-82', style: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'Crisis Support'),
        React.createElement(Text, { testID: 'Text-83', style: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
          'If you or your child is in crisis, please reach out immediately. Help is available right now.'
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-15', style: { backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 40, marginBottom: 12, width: '100%', alignItems: 'center' },
          onPress: function() { Linking.openURL('tel:18666621235'); }
        },
          React.createElement(Text, { testID: 'Text-84', style: { color: '#E8836A', fontSize: 16, fontWeight: '700' } }, 'Call 1-866-662-1235')
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-16', style: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 40, width: '100%', alignItems: 'center' },
          onPress: function() { Linking.openURL('sms:741741&body=HOME'); }
        },
          React.createElement(Text, { testID: 'Text-85', style: { color: '#fff', fontSize: 16, fontWeight: '600' } }, 'Text HOME to 741741')
        )
      ),

      React.createElement(View, { testID: 'View-79', style: { paddingHorizontal: 20, marginBottom: 20 } },
        React.createElement(Text, { testID: 'Text-86', style: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Additional Resources'),
        React.createElement(Text, { testID: 'Text-87', style: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 20 } },
          'Professional support and community resources for families.'
        ),
        helpResources.map(function(resource, index) {
          return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-17', key: index,
            style: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 14 },
            onPress: function() { Linking.openURL(resource.url); }
          },
            React.createElement(View, { testID: 'View-80', style: { flex: 1 } },
              React.createElement(Text, { testID: 'Text-88', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, resource.title),
              React.createElement(Text, { testID: 'Text-89', style: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 } }, resource.description)
            ),
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-18', style: { backgroundColor: '#5C7A5F', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
              onPress: function() { Linking.openURL(resource.url); }
            },
              React.createElement(Text, { testID: 'Text-90', style: { color: '#fff', fontSize: 12, fontWeight: '500' } }, resource.action)
            )
          );
        })
      ),

      React.createElement(View, { testID: 'View-81', style: { backgroundColor: '#E8836A', borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 20, alignItems: 'center' }
      },
        React.createElement(Text, { testID: 'Text-91', style: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'You Are Not Alone'),
        React.createElement(Text, { testID: 'Text-92', style: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 } },
          'Thousands of families are navigating this journey right now. With the right support, recovery is possible.'
        )
      ),

      React.createElement(View, { testID: 'View-82', style: { paddingHorizontal: 20, marginBottom: 8 } },
        React.createElement(Text, { testID: 'Text-93', style: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Find Local & Regional Clinics'),
        React.createElement(Text, { testID: 'Text-94', style: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 20 } },
          'Search for eating disorder specialists, treatment centers, and dietitians in your area.'
        ),
        clinicResources.map(function(resource, index) {
          return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-19', key: index,
            style: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
            onPress: function() { Linking.openURL(resource.url); }
          },
            React.createElement(View, { testID: 'View-83', style: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EBF2EC', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
              React.createElement(Text, { testID: 'Text-95', style: { fontSize: 20 } }, resource.icon)
            ),
            React.createElement(View, { testID: 'View-84', style: { flex: 1 } },
              React.createElement(Text, { testID: 'Text-96', style: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, resource.name),
              React.createElement(Text, { testID: 'Text-97', style: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 } }, resource.desc)
            ),
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-20', name: 'arrow-forward-ios', size: 16, color: theme.colors.textSecondary })
          );
        })
      ),

      React.createElement(View, { testID: 'View-85', style: { marginHorizontal: 20, marginBottom: 20 } },
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-20', style: { backgroundColor: theme.colors.card, paddingVertical: 14, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
          onPress: function() { logout(); setUserRole(null); }
        },
          React.createElement(Text, { testID: 'Text-98', style: { color: theme.colors.textSecondary, fontSize: 14 } }, 'Log out')
        )
      )
    )
  );
};
// @end:GetHelpScreen
// @section:FeelingsScreen @depends:[ThemeContext,styles]
const FeelingsScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState(null);
  const [showCoping, setShowCoping] = useState(false);

  const moods = [
    {
      emoji: '😊',
      label: 'Good',
      color: '#5C7A5F',
      message: 'That\'s wonderful! It\'s important to notice and celebrate the good moments.',
      coping: [
        'Write down 3 things you\'re grateful for today',
        'Share your good mood with someone you trust',
        'Do something creative that brings you joy',
        'Take a moment to appreciate how far you\'ve come'
      ]
    },
    {
      emoji: '😐',
      label: 'Okay',
      color: '#6A9BB8',
      message: 'Feeling okay is completely valid. Not every day needs to be amazing.',
      coping: [
        'Take a short walk outside and notice nature around you',
        'Listen to your favourite music for 10 minutes',
        'Try the breathing exercise on this app',
        'Text or call a friend just to say hello'
      ]
    },
    {
      emoji: '😔',
      label: 'Sad',
      color: '#9B6AB0',
      message: 'It\'s okay to feel sad. Your feelings are valid and you don\'t have to face them alone.',
      coping: [
        'Try the breathing exercise to help calm your body',
        'Write in a journal about how you\'re feeling',
        'Talk to someone you trust about what\'s going on',
        'Be gentle with yourself — recovery has ups and downs'
      ]
    },
    {
      emoji: '😰',
      label: 'Anxious',
      color: '#E8836A',
      message: 'Anxiety can feel overwhelming but it always passes. You\'ve got through it before.',
      coping: [
        'Try box breathing — breathe in 4, hold 4, out 4',
        'Name 5 things you can see right now',
        'Name 4 things you can touch, 3 you can hear',
        'Remind yourself: this feeling will pass'
      ]
    },
    {
      emoji: '😤',
      label: 'Angry',
      color: '#DC2626',
      message: 'Anger is a normal feeling. What matters is finding a safe way to express it.',
      coping: [
        'Take 10 slow deep breaths before doing anything',
        'Go for a walk or do some movement',
        'Write down what\'s making you angry',
        'Talk to a trusted adult about how you\'re feeling'
      ]
    },
    {
      emoji: '😴',
      label: 'Tired',
      color: '#888780',
      message: 'Rest is important for recovery. Be kind to your body and mind today.',
      coping: [
        'Rest without guilt — your body needs it',
        'Try the breathing exercise to help you relax',
        'Drink a glass of water and have a small snack',
        'Do something low energy that brings you comfort'
      ]
    }
  ];

  const handleMoodSelect = function(mood) {
    setSelectedMood(mood);
    setShowCoping(true);
  };

  const handleReset = function() {
    setSelectedMood(null);
    setShowCoping(false);
  };

  return React.createElement(View, { testID: 'View-49', style: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top
    }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-6', contentContainerStyle: {
        flexGrow: 1,
        paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20
      }
    },
      React.createElement(View, { testID: 'View-50', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-53', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'How are you feeling?'),
        React.createElement(Text, { testID: 'Text-54', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Check in with yourself. All feelings are welcome here.')
      ),

      showCoping === false ?
        React.createElement(View, { testID: 'View-51', style: { padding: 20 } },
          React.createElement(View, { testID: 'View-52', style: {
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 12
            }
          },
            moods.map(function(mood, index) {
              return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-12', key: index,
                style: {
                  width: '30%',
                  aspectRatio: 1,
                  backgroundColor: theme.colors.card,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: theme.colors.border,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 2
                },
                onPress: function() { handleMoodSelect(mood); }
              },
                React.createElement(Text, { testID: 'Text-55', style: { fontSize: 36, marginBottom: 6 } }, mood.emoji),
                React.createElement(Text, { testID: 'Text-56', style: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary } }, mood.label)
              );
            })
          ),
          React.createElement(View, { testID: 'View-53', style: {
              backgroundColor: '#EAF3F9',
              borderRadius: 16,
              padding: 20,
              marginTop: 8,
              borderWidth: 1,
              borderColor: '#9EC4DA'
            }
          },
            React.createElement(Text, { testID: 'Text-57', style: { fontSize: 15, color: '#185FA5', lineHeight: 22, textAlign: 'center' } },
              '💙 If you\'re feeling unsafe or in crisis, please call the helpline: 1-866-662-1235'
            )
          )
        )
      :
        React.createElement(View, { testID: 'View-54', style: { padding: 20 } },
          React.createElement(View, { testID: 'View-55', style: {
              backgroundColor: selectedMood.color,
              borderRadius: 20,
              padding: 28,
              alignItems: 'center',
              marginBottom: 20
            }
          },
            React.createElement(Text, { testID: 'Text-58', style: { fontSize: 56, marginBottom: 12 } }, selectedMood.emoji),
            React.createElement(Text, { testID: 'Text-59', style: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' } }, 'You\'re feeling ' + selectedMood.label),
            React.createElement(Text, { testID: 'Text-60', style: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 } }, selectedMood.message)
          ),

          React.createElement(View, { testID: 'View-56', style: {
              backgroundColor: theme.colors.card,
              borderRadius: 16,
              padding: 20,
              borderWidth: 1,
              borderColor: theme.colors.border,
              marginBottom: 20
            }
          },
            React.createElement(Text, { testID: 'Text-61', style: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 16 } }, '💚 Things that might help'),
            selectedMood.coping.map(function(tip, index) {
              return React.createElement(View, { testID: 'View-57', key: index,
                style: {
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginBottom: 14
                }
              },
                React.createElement(View, { testID: 'View-58', style: {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: selectedMood.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    marginTop: 2,
                    flexShrink: 0
                  }
                },
                  React.createElement(Text, { testID: 'Text-62', style: { color: '#fff', fontSize: 12, fontWeight: 'bold' } }, (index + 1).toString())
                ),
                React.createElement(Text, { testID: 'Text-63', style: { fontSize: 15, color: theme.colors.textPrimary, lineHeight: 22, flex: 1 } }, tip)
              );
            })
          ),

          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-13', style: {
              backgroundColor: '#5C7A5F',
              paddingVertical: 16,
              borderRadius: 40,
              alignItems: 'center',
              marginBottom: 12
            },
            onPress: handleReset
          },
            React.createElement(Text, { testID: 'Text-64', style: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' } }, 'Check in again')
          ),

          React.createElement(View, { testID: 'View-59', style: {
              backgroundColor: '#EAF3F9',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#9EC4DA'
            }
          },
            React.createElement(Text, { testID: 'Text-65', style: { fontSize: 14, color: '#185FA5', lineHeight: 20, textAlign: 'center' } },
              '💙 If you\'re feeling unsafe or in crisis, please call the helpline: 1-866-662-1235'
            )
          )
        )
    )
  );
};
// @end:FeelingsScreen

// @section:StoriesScreen @depends:[ThemeContext,styles]
const StoriesScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const [expandedStory, setExpandedStory] = useState(null);

const stories = [
    {
      name: 'Maya, age 19',
      avatar: '🌸',
      avatarColor: '#E8836A',
      tag: 'Anorexia recovery',
      tagColor: '#FDF0EC',
      tagTextColor: '#993C1D',
      preview: 'Recovery taught me that my worth isn\'t determined by a number on a scale.',
      videoUrl: 'https://www.youtube.com/results?search_query=anorexia+recovery+story+teen',
      videoLabel: 'Watch: Anorexia recovery stories',
      full: 'I struggled with anorexia for two years before I finally told my mum what was happening. I was terrified she would be angry or disappointed, but she just held me and cried. That was the moment everything started to change.\n\nRecovery wasn\'t easy or fast. There were days I wanted to give up. But slowly, with the help of my therapist and a dietitian who actually understood eating disorders, I started to find my way back.\n\nToday I can enjoy meals with friends and focus on my dreams. My worth was never about my body — it took me a long time to believe that, but now I do. If you\'re struggling, please tell someone you trust. You deserve help.'
    },
    {
      name: 'Alex, age 17',
      avatar: '⚽',
      avatarColor: '#6A9BB8',
      tag: 'Binge eating recovery',
      tagColor: '#EAF3F9',
      tagTextColor: '#185FA5',
      preview: 'I learned that asking for help was brave, not weak.',
      videoUrl: 'https://www.youtube.com/results?search_query=binge+eating+disorder+recovery+story',
      videoLabel: 'Watch: Binge eating recovery stories',
      full: 'I\'m a guy and I felt like eating disorders weren\'t supposed to happen to me. Nobody talks about boys with eating disorders, so I suffered in silence for over a year, thinking I was broken or weird.\n\nI used to binge eat secretly late at night when everyone was asleep. The shame afterwards was overwhelming. I thought I just needed more willpower — but it had nothing to do with willpower.\n\nMy school counselor noticed something was wrong and gently asked if I was okay. That conversation changed my life. My therapist helped me find healthy ways to cope with the stress and emotions I\'d been eating to escape.\n\nIf you\'re a guy reading this — eating disorders don\'t care about your gender. Please don\'t wait as long as I did to ask for help.'
    },
    {
      name: 'Sophie, age 16',
      avatar: '🎨',
      avatarColor: '#9B6AB0',
      tag: 'Bulimia recovery',
      tagColor: '#EEEDFE',
      tagTextColor: '#3C3489',
      preview: 'Art saved me when words couldn\'t express what I was going through.',
      videoUrl: 'https://www.youtube.com/results?search_query=bulimia+recovery+story+teen',
      videoLabel: 'Watch: Bulimia recovery stories',
      full: 'My eating disorder started when I was 14. I was being bullied about my body at school and I started restricting what I ate, then bingeing, then purging. I felt completely out of control and desperately ashamed.\n\nI didn\'t tell anyone for almost two years. I got really good at hiding it. But inside I was exhausted and scared.\n\nWhat helped me most, strangely, was art. My therapist suggested I try expressing my feelings through drawing instead of talking about them. Something unlocked. I started painting how I felt — the chaos, the shame, but also the tiny bits of hope.\n\nRecovery is ongoing for me. I still have hard days. But I have tools now, and people who know what I\'m going through. You don\'t have to carry this alone.'
    },
    {
      name: 'Jordan, age 20',
      avatar: '🎵',
      avatarColor: '#5C7A5F',
      tag: 'ARFID recovery',
      tagColor: '#EBF2EC',
      tagTextColor: '#3B5E3D',
      preview: 'I used to be terrified of food. Now I can eat at restaurants with friends.',
      videoUrl: 'https://www.youtube.com/results?search_query=ARFID+recovery+story',
      videoLabel: 'Watch: ARFID recovery stories',
      full: 'I had ARFID — Avoidant Restrictive Food Intake Disorder — though I didn\'t know that\'s what it was called until I was 18. I just knew that most foods made me feel sick with fear. The texture, the smell, the thought of trying something new was genuinely terrifying.\n\nPeople thought I was just picky or difficult. Family dinners were a nightmare. School trips were anxiety-inducing. I avoided social situations that involved food, which was basically everything.\n\nFinding a therapist who specialised in ARFID was life-changing. They didn\'t force me to eat anything. We worked slowly, at my pace, using exposure therapy. It took over a year but I made real progress.\n\nLast month I went to a restaurant with friends and tried something I\'d never eaten before. A small thing to most people — a huge thing for me. Recovery is possible, even when it feels impossible.'
    },
    {
      name: 'Priya, age 18',
      avatar: '🌟',
      avatarColor: '#BA7517',
      tag: 'Orthorexia recovery',
      tagColor: '#FAEEDA',
      tagTextColor: '#633806',
      preview: 'I thought I was being healthy. I didn\'t realise how sick I was becoming.',
      videoUrl: 'https://www.youtube.com/results?search_query=orthorexia+recovery+story',
      videoLabel: 'Watch: Orthorexia recovery stories',
      full: 'Mine started as what I thought was a health kick. I started cutting out processed food, then sugar, then entire food groups. I told myself I was being healthy and disciplined. My friends said I was so good for eating clean.\n\nBut the rules kept getting stricter. I became terrified of eating anything I hadn\'t prepared myself. Social eating felt impossible. I spent hours researching ingredients. If I accidentally ate something "bad" I would spiral into anxiety for days.\n\nMy mum noticed I was losing weight and becoming isolated. She took me to our doctor who referred me to an eating disorder specialist. I was diagnosed with orthorexia — an obsession with "healthy" eating that had become deeply unhealthy.\n\nRecovery meant learning that no food is morally good or bad. Food is just food. It nourishes you, it brings people together, it brings joy. That sounds simple but it took me a long time to truly believe it.'
    },
    {
      name: 'Sam, age 15',
      avatar: '🏃',
      avatarColor: '#E8836A',
      tag: 'Exercise addiction recovery',
      tagColor: '#FDF0EC',
      tagTextColor: '#993C1D',
      preview: 'I thought exercising more was always better. I was wrong.',
      videoUrl: 'https://www.youtube.com/results?search_query=exercise+addiction+eating+disorder+recovery',
      videoLabel: 'Watch: Exercise addiction recovery',
      full: 'I was a competitive runner and I loved it. But somewhere along the way, exercise stopped being something I loved and became something I was compelled to do. I exercised even when I was injured. Even when I was exhausted. Even when it was hurting me.\n\nI restricted what I ate to try to run faster. I felt intense guilt and anxiety on rest days. My coach noticed my performance was actually getting worse, not better, and pulled me aside.\n\nAt first I was defensive. I thought I was just dedicated. But when my doctor told me I had stress fractures in both legs from overtraining and under-fuelling, I had to face the truth.\n\nRecovery meant learning to rest without guilt, to eat enough to fuel my body, and to find joy in movement again rather than compulsion. I still love running — but now I run because it makes me happy, not because I\'m afraid of what happens if I stop.'
    }
  ];

  const handleStoryPress = function(index) {
    if (expandedStory === index) {
      setExpandedStory(null);
    } else {
      setExpandedStory(index);
    }
  };

  return React.createElement(View, { testID: 'View-74', style: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingTop: insets.top
    }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-8', contentContainerStyle: {
        flexGrow: 1,
        paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20
      }
    },
      React.createElement(View, { testID: 'View-75', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-79', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Recovery Stories'),
        React.createElement(Text, { testID: 'Text-80', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Real stories from young people who\'ve been through it — and come out the other side.')
      ),

      React.createElement(View, { testID: 'View-76', style: {
          backgroundColor: '#EBF2EC',
          borderRadius: 16,
          padding: 20,
          marginHorizontal: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: '#A8C4AA'
        }
      },
        React.createElement(Text, { testID: 'Text-81', style: { fontSize: 15, color: '#3B5E3D', lineHeight: 22, textAlign: 'center', fontStyle: 'italic' } },
          '"Recovery is not a straight line — but it is real, and it happens for thousands of young people every year. You could be next."'
        )
      ),

      stories.map(function(story, index) {
        var isExpanded = expandedStory === index;
        return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-15', key: index,
          style: {
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            marginHorizontal: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isExpanded ? story.avatarColor : theme.colors.border,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
            overflow: 'hidden'
          },
          onPress: function() { handleStoryPress(index); }
        },
          React.createElement(View, { testID: 'View-77', style: {
              padding: 20
            }
          },
            React.createElement(View, { testID: 'View-78', style: {
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }
            },
              React.createElement(View, { testID: 'View-79', style: {
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: story.avatarColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14
                }
              },
                React.createElement(Text, { testID: 'Text-82', style: { fontSize: 22 } }, story.avatar)
              ),
              React.createElement(View, { testID: 'View-80', style: { flex: 1 } },
                React.createElement(Text, { testID: 'Text-83', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, story.name),
                React.createElement(View, { testID: 'View-81', style: {
                    backgroundColor: story.tagColor,
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 20,
                    alignSelf: 'flex-start'
                  }
                },
                  React.createElement(Text, { testID: 'Text-84', style: { fontSize: 11, fontWeight: '500', color: story.tagTextColor } }, story.tag)
                )
              ),
              React.createElement(MaterialIcons, { testID: 'MaterialIcons-22', name: isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down',
                size: 24,
                color: theme.colors.textSecondary
              })
            ),

            React.createElement(Text, { testID: 'Text-85', style: {
                fontSize: 15,
                color: theme.colors.textSecondary,
                lineHeight: 22,
                fontStyle: 'italic',
                borderLeftWidth: 3,
                borderLeftColor: story.avatarColor,
                paddingLeft: 12
              }
            }, '"' + story.preview + '"'),

            isExpanded ?
              React.createElement(View, { testID: 'View-82', style: { marginTop: 16 } },
                story.full.split('\n\n').map(function(paragraph, pIndex) {
                  return React.createElement(Text, { testID: 'Text-86', key: pIndex,
                    style: {
                      fontSize: 15,
                      color: theme.colors.textPrimary,
                      lineHeight: 24,
                      marginBottom: 14
                    }
                  }, paragraph);
                }),
                React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-16', style: {
                    backgroundColor: story.avatarColor,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 40,
                    alignSelf: 'center',
                    marginTop: 4
                  },
                  onPress: function() { setExpandedStory(null); }
                },
                React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-18', style: {
                    backgroundColor: story.avatarColor,
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 40,
                    alignSelf: 'center',
                    marginTop: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8
                  },
                  onPress: function() { Linking.openURL(story.videoUrl); }
                },
                  React.createElement(MaterialIcons, { testID: 'MaterialIcons-25', name: 'play-circle-outline', size: 18, color: '#fff' }),
                  React.createElement(Text, { testID: 'Text-100', style: { color: '#fff', fontSize: 14, fontWeight: '500' } }, story.videoLabel)
                ),                
                  React.createElement(Text, { testID: 'Text-87', style: { color: '#fff', fontSize: 14, fontWeight: '500' } }, 'Close story')
                )
              )
            : null
          )
        );
      }),

      React.createElement(View, { testID: 'View-83', style: {
          backgroundColor: '#5C7A5F',
          borderRadius: 16,
          padding: 24,
          marginHorizontal: 20,
          marginTop: 4,
          alignItems: 'center'
        }
      },
        React.createElement(Text, { testID: 'Text-88', style: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'Your story matters too'),
        React.createElement(Text, { testID: 'Text-89', style: { fontSize: 15, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
          'Recovery is possible for you. These people were once where you are now. You don\'t have to face this alone.'
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-17', style: {
            backgroundColor: '#fff',
            paddingVertical: 12,
            paddingHorizontal: 28,
            borderRadius: 40
          },
          onPress: function() { Linking.openURL('tel:18666621235'); }
        },
          React.createElement(Text, { testID: 'Text-90', style: { color: '#5C7A5F', fontSize: 15, fontWeight: '600' } }, 'Talk to someone now')
        )
      ),

      React.createElement(View, { testID: 'View-84', style: { height: 20 } })
    )
  );
};
// @end:StoriesScreen
  
// @section:MealtimeScreen @depends:[ThemeContext,styles]
const MealtimeScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('before');
  const [mealEntries, setMealEntries] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealNote, setMealNote] = useState('');
  const [mealWentWell, setMealWentWell] = useState(true);
  const [savingMeal, setSavingMeal] = useState(false);
  const { token, user } = useAuth();

  const tabs = [
    { key: 'before', label: 'Before' },
    { key: 'during', label: 'During' },
    { key: 'after', label: 'After' },
    { key: 'scripts', label: 'Scripts' },
    { key: 'journal', label: 'Meal Journal' }
  ];

  useEffect(function() {
    if (!token) return;
    fetch(SUPABASE_URL + '/rest/v1/meal_journal?order=created_at.desc', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data)) setMealEntries(data);
    })
    .catch(function() {});
  }, [token]);

  const handleAddMeal = function() {
    if (!mealName.trim()) return;
    if (savingMeal) return;
    setSavingMeal(true);

    var entry = {
      name: mealName.trim(),
      note: mealNote.trim(),
      went_well: mealWentWell,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      user_id: user.id
    };

    setMealName('');
    setMealNote('');
    setMealWentWell(true);

    fetch(SUPABASE_URL + '/rest/v1/meal_journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(entry)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      setSavingMeal(false);
      if (Array.isArray(data) && data.length > 0) {
        setMealEntries(function(prev) { return [data[0]].concat(prev); });
      }
    })
    .catch(function() {
      setSavingMeal(false);
    });
  };

  const handleDeleteMeal = function(id) {
    var newEntries = mealEntries.filter(function(e) { return e.id !== id; });
    setMealEntries(newEntries);
    fetch(SUPABASE_URL + '/rest/v1/meal_journal?id=eq.' + id, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    })
    .catch(function() {});
  };

  const beforeTips = [
    {
      icon: '🕐',
      title: 'Keep mealtimes predictable',
      desc: 'Serve meals at consistent times each day. Predictability reduces anxiety for children with eating disorders. Avoid last-minute changes to what is being served.'
    },
    {
      icon: '🍽️',
      title: 'Prepare the environment',
      desc: 'Turn off the TV. Put phones away. Create a calm, distraction-free table. Soft background music can help reduce tension without being a distraction.'
    },
    {
      icon: '💬',
      title: 'Plan your conversation topics',
      desc: 'Think ahead about neutral, positive topics to discuss during the meal — school, hobbies, upcoming plans. This keeps the atmosphere light and takes focus away from food.'
    },
    {
      icon: '🧘',
      title: 'Regulate yourself first',
      desc: 'Take a few deep breaths before calling your child to the table. Your calm energy directly affects theirs. If you are anxious, they will feel it.'
    },
    {
      icon: '🥗',
      title: 'Serve food without negotiation',
      desc: 'Place food on the table without asking what they want or offering alternatives. Presenting food as non-negotiable — warmly but firmly — is a core principle of Family-Based Treatment.'
    }
  ];

  const duringTips = [
    {
      icon: '😊',
      title: 'Stay calm no matter what',
      desc: 'Your child may cry, argue, push food away, or say hurtful things. This is the eating disorder speaking, not your child. Stay warm, stay calm, and do not engage in arguments about food.'
    },
    {
      icon: '🗣️',
      title: 'Use neutral conversation',
      desc: 'Talk about anything except food, eating, weight, or bodies. Ask about their day, their friends, something funny that happened. Normal conversation helps normalise the mealtime.'
    },
    {
      icon: '⏱️',
      title: 'Set a gentle time expectation',
      desc: 'Meals should last 20-30 minutes. Sitting together for the full duration — even if eating is difficult — is important. Do not rush, but do not allow meals to drag on for hours.'
    },
    {
      icon: '🚫',
      title: 'Do not comment on what or how much they eat',
      desc: 'Avoid saying "good job eating that" or "you barely touched anything." Both put unhelpful attention on the food. Simply being present and calm is enough.'
    },
    {
      icon: '💪',
      title: 'Hold the boundary with compassion',
      desc: 'If your child tries to leave the table early, calmly redirect them to stay. "I know this is hard. I love you and we are going to sit together until everyone is finished."'
    },
    {
      icon: '🤝',
      title: 'You are on the same team',
      desc: 'Remind yourself and your child — you are not the enemy. The eating disorder is the problem. You are fighting it together, not against each other.'
    }
  ];

const afterTips = [
    {
      icon: '⏰',
      title: 'Stay together for 30 minutes after eating',
      desc: 'Gently keep your child with the family for at least 30 minutes after a meal. This helps prevent compensatory behaviours and provides emotional support during a difficult time.'
    },
    {
      icon: '🎮',
      title: 'Plan a post-meal activity',
      desc: 'Have something ready to do together after the meal — a game, a show, a walk, a craft. This makes the post-meal period feel normal and gives everyone something to focus on.'
    },
    {
      icon: '❤️',
      title: 'Acknowledge their effort privately',
      desc: 'After the meal, privately tell your child you are proud of them for sitting at the table — not for what they ate, but for showing up. "I know that was really hard. I\'m proud of you."'
    },
    {
      icon: '🎵',
      title: 'Use music as a transition tool',
      desc: 'Put on a playlist your child enjoys right after the meal. Music shifts the emotional atmosphere and gives the brain something pleasant to focus on during the most anxious post-meal window.'
    },
    {
      icon: '🧩',
      title: 'Keep hands busy',
      desc: 'Suggest a simple activity that occupies the hands — a puzzle, drawing, knitting, or a phone game. Physical engagement helps redirect anxious energy away from thoughts about food.'
    },
    {
      icon: '📺',
      title: 'Watch something together',
      desc: 'A favourite show or a funny video creates a natural reason to stay together and provides emotional distraction. Choose something light — comedies and nature documentaries work well.'
    },
    {
      icon: '🚶',
      title: 'A gentle walk if appropriate',
      desc: 'A slow, relaxed walk together can help with post-meal anxiety. Important: this should be truly gentle and social — not exercise. Discuss this with your treatment team if exercise is a concern.'
    },
    {
      icon: '🫁',
      title: 'Try box breathing together',
      desc: 'If your child is visibly distressed after eating, offer to do box breathing together — breathe in for 4, hold for 4, out for 4. Doing it together feels less clinical and more like connection.'
    },
    {
      icon: '💬',
      title: 'Validate without fixing',
      desc: 'If your child expresses distress, try: "I can see this feels really hard right now. I\'m here." Resist the urge to explain, reassure, or problem-solve — sometimes being heard is enough.'
    },
    {
      icon: '📝',
      title: 'Note what worked',
      desc: 'Keep a brief mental or written note of what made today\'s post-meal period easier or harder. Over time you will notice patterns — certain activities, conversations, or environments that help.'
    },
    {
      icon: '🧡',
      title: 'Take care of yourself too',
      desc: 'Mealtimes and the aftermath are emotionally draining for parents. After your child is settled, check in with yourself. Talk to a partner, friend, or therapist about how you are coping.'
    },
    {
      icon: '🌙',
      title: 'End the evening with connection',
      desc: 'Before bed, find a moment of warmth with your child that has nothing to do with food — a hug, a joke, reading together, or just sitting quietly. End the day as a family, not as adversaries.'
    }
  ];

const scripts = [
    {
      situation: 'When they refuse to come to the table',
      color: '#E8836A',
      do: '"Dinner is ready. I\'d love for you to join us. I know mealtimes feel hard right now and I\'m here with you."',
      avoid: '"You HAVE to eat. Get to the table right now." — This escalates conflict.'
    },
    {
      situation: 'When they say "I\'m not hungry"',
      color: '#6A9BB8',
      do: '"I hear you. Your body might not be sending hunger signals right now — that\'s part of what we\'re working on. Let\'s sit together anyway."',
      avoid: '"How can you not be hungry? You haven\'t eaten all day!" — This creates shame and argument.'
    },
    {
      situation: 'When they say the food is disgusting or wrong',
      color: '#9B6AB0',
      do: '"I understand you feel that way. This is what we\'re having tonight. I\'m right here with you."',
      avoid: '"I made this especially for you!" or "Fine, I\'ll make something else." — This reinforces avoidance.'
    },
    {
      situation: 'When they cry or get upset at the table',
      color: '#5C7A5F',
      do: '"It\'s okay to feel upset. I\'m not going anywhere. We can sit here together."',
      avoid: '"Stop crying and just eat." or "You\'re ruining dinner for everyone." — This adds shame to distress.'
    },
    {
      situation: 'When they accuse you of not caring',
      color: '#BA7517',
      do: '"I\'m doing this because I love you and I want you to be healthy. I know it doesn\'t feel that way right now."',
      avoid: '"After everything I do for you!" — This makes it about you rather than them.'
    },
    {
      situation: 'When they do well at a meal',
      color: '#5C7A5F',
      do: '"I\'m really glad we had dinner together tonight." (Focus on connection, not food)',
      avoid: '"You ate so much! Great job!" — Praising food intake puts unhealthy focus on amounts.'
    },
    {
      situation: 'When they say "Everyone else eats whatever they want"',
      color: '#E8836A',
      do: '"You\'re right that everyone\'s body and situation is different. Right now we\'re focusing on what helps you feel well."',
      avoid: '"That\'s not true, stop being dramatic." — Dismisses their feelings entirely.'
    },
    {
      situation: 'When they ask "Am I fat?"',
      color: '#6A9BB8',
      do: '"I love you and I\'m not going to answer that question. What I know is that your body deserves to be nourished and cared for."',
      avoid: 'Any answer about weight or appearance — this reinforces body-focused thinking.'
    },
    {
      situation: 'When they push food around but won\'t eat',
      color: '#9B6AB0',
      do: '"I notice this is hard right now. I\'m going to stay here with you. There\'s no rush."',
      avoid: '"You\'ve barely touched anything!" — Drawing attention to the food makes anxiety worse.'
    },
    {
      situation: 'When they say "I already ate at school"',
      color: '#BA7517',
      do: '"I\'m glad you had something earlier. We still sit together for family dinner — you don\'t have to eat a lot, but I\'d like you here with us."',
      avoid: '"Prove it." or "You\'re lying." — Accusation destroys trust and escalates the situation.'
    },
    {
      situation: 'When they have a meltdown mid-meal',
      color: '#5C7A5F',
      do: '"Let\'s take a short break together. We can step outside for two minutes and come back. I\'m not giving up on us."',
      avoid: 'Raising your voice, threatening consequences, or abandoning the meal entirely.'
    },
    {
      situation: 'When they ask why you make them eat',
      color: '#E8836A',
      do: '"Because your body needs fuel to think, grow, and heal. And because I love you too much to let the eating disorder make all the decisions right now."',
      avoid: '"Because I said so." or "Because the doctor said so." — Removes the love from the message.'
    },
    {
      situation: 'When dinner went badly and you feel defeated',
      color: '#6A9BB8',
      do: 'Talk to another parent, your therapist, or a support group. Say to yourself: "Today was hard. I showed up anyway. That matters."',
      avoid: 'Blaming yourself or your child. Hard mealtimes are part of the process, not evidence of failure.'
    },
    {
      situation: 'When they say "I hate you for making me do this"',
      color: '#9B6AB0',
      do: '"I know you\'re really angry right now. I love you even when you\'re angry at me. That\'s not going to change."',
      avoid: '"How dare you say that." — Reacting to the words rather than the pain underneath them.'
    },
    {
      situation: 'When they seem to be making progress',
      color: '#5C7A5F',
      do: '"I\'ve really enjoyed our dinners together lately. You seem a little more relaxed and that makes me happy."',
      avoid: '"You\'re eating so much better!" — Keep the focus on connection and wellbeing, not food amounts.'
    }
  ];

  const currentTips = activeTab === 'before' ? beforeTips : activeTab === 'during' ? duringTips : afterTips;

  return React.createElement(View, { testID: 'View-85', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-9', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-86', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-91', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Mealtime Support'),
        React.createElement(Text, { testID: 'Text-92', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Practical guidance for navigating mealtimes with your child')
      ),

      React.createElement(View, { testID: 'View-87', style: { backgroundColor: '#EAF3F9', borderRadius: 16, margin: 20, marginTop: 8, padding: 18, borderWidth: 1, borderColor: '#9EC4DA' }
      },
        React.createElement(Text, { testID: 'Text-93', style: { fontSize: 14, color: '#185FA5', lineHeight: 22, textAlign: 'center' } },
          '💙 These tips are based on Family-Based Treatment (FBT) — the gold standard evidence-based approach for adolescent eating disorders.'
        )
      ),

      React.createElement(View, { testID: 'View-88', style: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: theme.colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.colors.border }
      },
        tabs.map(function(tab) {
          var isActive = activeTab === tab.key;
          return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-18', key: tab.key,
            style: {
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: 'center',
              backgroundColor: isActive ? '#5C7A5F' : 'transparent'
            },
            onPress: function() { setActiveTab(tab.key); }
          },
            React.createElement(Text, { testID: 'Text-94', style: { fontSize: 13, fontWeight: '500', color: isActive ? '#fff' : theme.colors.textSecondary }
            }, tab.label)
          );
        })
      ),

    activeTab === 'before' || activeTab === 'during' || activeTab === 'after' ?
      React.createElement(View, { testID: 'View-99', style: { paddingHorizontal: 20 } },
        currentTips.map(function(tip, index) {
          return React.createElement(View, { testID: 'View-100', key: index,
            style: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 14 }
          },
            React.createElement(Text, { testID: 'Text-105', style: { fontSize: 24, flexShrink: 0, marginTop: 2 } }, tip.icon),
            React.createElement(View, { testID: 'View-101', style: { flex: 1 } },
              React.createElement(Text, { testID: 'Text-106', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 6 } }, tip.title),
              React.createElement(Text, { testID: 'Text-107', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 } }, tip.desc)
            )
          );
        }),
        activeTab === 'before' ?
          React.createElement(View, { testID: 'View-105', style: { marginTop: 8 } },
            React.createElement(Text, { testID: 'Text-112', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 } }, '🎬 Helpful videos for parents'),
            [
              { title: 'About Family-Based Treatment — NEDA', url: 'https://www.youtube.com/results?search_query=family+based+treatment+eating+disorder+FBT', desc: 'Search results for FBT educational videos' },
              { title: 'Supporting your child at mealtimes', url: 'https://www.youtube.com/results?search_query=supporting+child+eating+disorder+mealtime', desc: 'Search results for mealtime support guidance' },
              { title: 'Parent support for eating disorders — FEAST', url: 'https://www.feast-ed.org', desc: 'FEAST parent resources and guidance' }
            ].map(function(video, index) {
              return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-21', key: index,
                style: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
                onPress: function() { Linking.openURL(video.url); }
              },
                React.createElement(View, { testID: 'View-106', style: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FCEBEB', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
                  React.createElement(MaterialIcons, { testID: 'MaterialIcons-26', name: 'play-circle-outline', size: 24, color: '#E8836A' })
                ),
                React.createElement(View, { testID: 'View-107', style: { flex: 1 } },
                  React.createElement(Text, { testID: 'Text-113', style: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 } }, video.title),
                  React.createElement(Text, { testID: 'Text-114', style: { fontSize: 12, color: theme.colors.textSecondary, lineHeight: 18 } }, video.desc)
                ),
                React.createElement(MaterialIcons, { testID: 'MaterialIcons-27', name: 'arrow-forward-ios', size: 14, color: theme.colors.textSecondary })
              );
            })
          ) : null
      )
    : activeTab === 'scripts' ?
      React.createElement(View, { testID: 'View-102', style: { paddingHorizontal: 20 } },
        React.createElement(Text, { testID: 'Text-108', style: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 22 } },
          'Real example phrases for common mealtime situations. Adapt these to your own voice and relationship.'
        ),
        scripts.map(function(script, index) {
          return React.createElement(View, { testID: 'View-103', key: index,
            style: { backgroundColor: theme.colors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' }
          },
            React.createElement(View, { testID: 'View-104', style: { backgroundColor: script.color, padding: 14 } },
              React.createElement(Text, { testID: 'Text-109', style: { fontSize: 14, fontWeight: '600', color: '#fff' } }, script.situation)
            ),
            React.createElement(View, { testID: 'View-105', style: { padding: 16 } },
              React.createElement(View, { testID: 'View-106', style: { backgroundColor: '#EBF2EC', borderRadius: 10, padding: 14, marginBottom: 10 } },
                React.createElement(Text, { testID: 'Text-110', style: { fontSize: 12, fontWeight: '600', color: '#3B5E3D', marginBottom: 6 } }, '\u2713 TRY THIS'),
                React.createElement(Text, { testID: 'Text-111', style: { fontSize: 14, color: '#2D3748', lineHeight: 22, fontStyle: 'italic' } }, script.do)
              ),
              React.createElement(View, { testID: 'View-107', style: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 14 } },
                React.createElement(Text, { testID: 'Text-112', style: { fontSize: 12, fontWeight: '600', color: '#A32D2D', marginBottom: 6 } }, '\u2717 AVOID'),
                React.createElement(Text, { testID: 'Text-113', style: { fontSize: 14, color: '#2D3748', lineHeight: 22, fontStyle: 'italic' } }, script.avoid)
              )
            )
          );
        }),
        React.createElement(View, { testID: 'View-108', style: { backgroundColor: '#EBF2EC', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#A8C4AA' }
        },
          React.createElement(Text, { testID: 'Text-114', style: { fontSize: 15, color: '#3B5E3D', lineHeight: 22, textAlign: 'center' } },
            '\uD83C\uDF3F Remember: There are no perfect words. Showing up with love and consistency matters more than saying everything right.'
          )
        )
      )
    :
      React.createElement(View, { testID: 'View-109', style: { paddingHorizontal: 20 } },
        React.createElement(View, { testID: 'View-110', style: { backgroundColor: '#EAF3F9', borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#9EC4DA' }
        },
          React.createElement(Text, { testID: 'Text-115', style: { fontSize: 16, fontWeight: '600', color: '#185FA5', marginBottom: 6 } }, '\uD83D\uDCD3 Your Family\'s Meal Journal'),
          React.createElement(Text, { testID: 'Text-116', style: { fontSize: 14, color: '#5A5750', lineHeight: 22 } },
            'Keep track of meals your child was comfortable with. Over time this becomes your family\'s personal reference — no more wondering what to make.'
          )
        ),

        React.createElement(View, { testID: 'View-111', style: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border }
        },
          React.createElement(Text, { testID: 'Text-117', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 14 } }, 'Add a meal'),
          React.createElement(require('react-native').TextInput, {
            style: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: theme.colors.textPrimary, marginBottom: 10, fontFamily: 'Arial', backgroundColor: '#FAF7F2' },
            placeholder: 'Meal name (e.g. pasta with tomato sauce)',
            placeholderTextColor: theme.colors.textSecondary,
            value: mealName,
            onChangeText: setMealName,
            autoCorrect: true,
            autoComplete: 'on'
          }),
          React.createElement(require('react-native').TextInput, {
            style: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10, padding: 12, fontSize: 14, color: theme.colors.textPrimary, marginBottom: 14, fontFamily: 'Arial', backgroundColor: '#FAF7F2', minHeight: 70, textAlignVertical: 'top' },
            placeholder: 'Notes (e.g. ate most of it, seemed relaxed)',
            placeholderTextColor: theme.colors.textSecondary,
            value: mealNote,
            onChangeText: setMealNote,
            multiline: true,
            autoCorrect: true,
            autoComplete: 'on'
          }),
          React.createElement(View, { testID: 'View-112', style: { flexDirection: 'row', gap: 10, marginBottom: 14 } },
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-19', style: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: mealWentWell ? '#5C7A5F' : theme.colors.card, borderWidth: 1, borderColor: mealWentWell ? '#5C7A5F' : theme.colors.border },
              onPress: function() { setMealWentWell(true); }
            },
              React.createElement(Text, { testID: 'Text-118', style: { fontSize: 13, fontWeight: '500', color: mealWentWell ? '#fff' : theme.colors.textSecondary } }, '\u2705 Went well')
            ),
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-20', style: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: !mealWentWell ? '#E8836A' : theme.colors.card, borderWidth: 1, borderColor: !mealWentWell ? '#E8836A' : theme.colors.border },
              onPress: function() { setMealWentWell(false); }
            },
              React.createElement(Text, { testID: 'Text-119', style: { fontSize: 13, fontWeight: '500', color: !mealWentWell ? '#fff' : theme.colors.textSecondary } }, '\uD83D\uDCAA Needs work')
            )
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-21', style: { backgroundColor: mealName.trim() && !savingMeal ? '#5C7A5F' : '#C8DBC9', paddingVertical: 14, borderRadius: 40, alignItems: 'center' },
            onPress: handleAddMeal,
            disabled: !mealName.trim() || savingMeal
          },
            React.createElement(Text, { testID: 'Text-120', style: { color: '#fff', fontSize: 15, fontWeight: '600' } }, savingMeal ? 'Saving...' : 'Save to journal')
          )
        ),

        mealEntries.length === 0 ?
          React.createElement(View, { testID: 'View-113', style: { alignItems: 'center', padding: 32 } },
            React.createElement(Text, { testID: 'Text-121', style: { fontSize: 36, marginBottom: 12 } }, '\uD83C\uDF7D\uFE0F'),
            React.createElement(Text, { testID: 'Text-122', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' } }, 'No meals saved yet'),
            React.createElement(Text, { testID: 'Text-123', style: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 } },
              'Start adding meals that worked well for your family. Over time you\'ll build a helpful personal reference.'
            )
          )
        :
          React.createElement(View, { testID: 'View-114' },
            React.createElement(Text, { testID: 'Text-124', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 } }, 'Saved meals (' + mealEntries.length + ')'),
            mealEntries.map(function(entry, index) {
              return React.createElement(View, { testID: 'View-115', key: entry.id,
                style: { backgroundColor: theme.colors.card, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border, borderLeftWidth: 4, borderLeftColor: entry.went_well ? '#5C7A5F' : '#E8836A' }
              },
                React.createElement(View, { testID: 'View-116', style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } },
                  React.createElement(View, { testID: 'View-117', style: { flex: 1 } },
                    React.createElement(Text, { testID: 'Text-125', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 2 } }, entry.name),
                    React.createElement(View, { testID: 'View-118', style: { flexDirection: 'row', alignItems: 'center', gap: 8 } },
                      React.createElement(View, { testID: 'View-119', style: { backgroundColor: entry.went_well ? '#EBF2EC' : '#FDF0EC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 }
                      },
                        React.createElement(Text, { testID: 'Text-126', style: { fontSize: 11, fontWeight: '500', color: entry.went_well ? '#3B5E3D' : '#993C1D' } }, entry.went_well ? '\u2705 Went well' : '\uD83D\uDCAA Needs work')
                      ),
                      React.createElement(Text, { testID: 'Text-127', style: { fontSize: 11, color: theme.colors.textSecondary } }, entry.date)
                    )
                  ),
                  React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-22', style: { padding: 4 },
                    onPress: function() { handleDeleteMeal(entry.id); }
                  },
                    React.createElement(MaterialIcons, { testID: 'MaterialIcons-23', name: 'delete-outline', size: 20, color: theme.colors.textSecondary })
                  )
                ),
                entry.note ? React.createElement(Text, { testID: 'Text-128', style: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20, marginTop: 6, fontStyle: 'italic' } }, entry.note) : null
              );
            })
          )
      ),
      React.createElement(View, { testID: 'View-126', style: { backgroundColor: '#5C7A5F', borderRadius: 16, margin: 20, padding: 20, alignItems: 'center' }
      },
        React.createElement(Text, { testID: 'Text-136', style: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'Need personalised meal planning?'),
        React.createElement(Text, { testID: 'Text-137', style: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
          'A registered dietitian specialising in eating disorders can create a meal plan tailored specifically to your child\'s needs and stage of recovery.'
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-26', style: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 40 },
          onPress: function() { Linking.openURL('https://www.eatright.org/find-a-nutrition-expert'); }
        },
          React.createElement(Text, { testID: 'Text-138', style: { color: '#5C7A5F', fontSize: 15, fontWeight: '600' } }, 'Find a Dietitian')
        )
      )        
    )
  );
};
// @end:MealtimeScreen

// @section:CommunityScreen @depends:[ThemeContext,styles]
const CommunityScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();

  const onlineGroups = [
    {
      icon: '🌿',
      name: 'Alliance for Eating Disorders Awareness',
      desc: 'Official parent support groups run by eating disorder specialists. Moderated and safe.',
      type: 'Online & In-person',
      color: '#5C7A5F',
      bgColor: '#EBF2EC',
      url: 'https://www.allianceforeatingdisorders.com'
    },
    {
      icon: '👥',
      name: 'Around the Dinner Table Forum',
      desc: 'The largest online forum specifically for parents and caregivers supporting loved ones with eating disorders. Based on FBT principles.',
      type: 'Online forum',
      color: '#6A9BB8',
      bgColor: '#EAF3F9',
      url: 'https://www.feast-ed.org/around-the-dinner-table-forum/'
    },
    {
      icon: '📘',
      name: 'Facebook: ED Parent Support',
      desc: 'Private Facebook group for parents of children with eating disorders. Thousands of members sharing daily support.',
      type: 'Facebook group',
      color: '#185FA5',
      bgColor: '#E6F1FB',
      url: 'https://www.facebook.com/groups/EDparentssupport'
    },
    {
      icon: '💬',
      name: 'Reddit: r/EatingDisorders',
      desc: 'A supportive Reddit community for families and individuals affected by eating disorders. Active and compassionate.',
      type: 'Reddit community',
      color: '#E8836A',
      bgColor: '#FDF0EC',
      url: 'https://www.reddit.com/r/EatingDisorders'
    },
    {
      icon: '🤝',
      name: 'NEDA Network',
      desc: 'Connect with other families through the National Eating Disorders Association network of support groups across the US.',
      type: 'In-person & online',
      color: '#9B6AB0',
      bgColor: '#EEEDFE',
      url: 'https://www.nationaleatingdisorders.org/help-support/contact-helpline'
    }
  ];

  const renderGroupCard = function(group, index) {
    return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-20', key: index,
      style: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden'
      },
      onPress: function() { Linking.openURL(group.url); }
    },
      React.createElement(View, { testID: 'View-100', style: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 } },
        React.createElement(View, { testID: 'View-101', style: { width: 48, height: 48, borderRadius: 12, backgroundColor: group.bgColor, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
        },
          React.createElement(Text, { testID: 'Text-108', style: { fontSize: 22 } }, group.icon)
        ),
        React.createElement(View, { testID: 'View-102', style: { flex: 1 } },
          React.createElement(Text, { testID: 'Text-109', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, group.name),
          React.createElement(Text, { testID: 'Text-110', style: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: 6 } }, group.desc),
          React.createElement(View, { testID: 'View-103', style: { backgroundColor: group.bgColor, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' }
          },
            React.createElement(Text, { testID: 'Text-111', style: { fontSize: 11, fontWeight: '500', color: group.color } }, group.type)
          )
        ),
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-23', name: 'arrow-forward-ios', size: 16, color: theme.colors.textSecondary })
      )
    );
  };

  const renderClinicCard = function(resource, index) {
    return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-21', key: index,
      style: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 14
      },
      onPress: function() { Linking.openURL(resource.url); }
    },
      React.createElement(View, { testID: 'View-104', style: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EBF2EC', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
      },
        React.createElement(Text, { testID: 'Text-112', style: { fontSize: 20 } }, resource.icon)
      ),
      React.createElement(View, { testID: 'View-105', style: { flex: 1 } },
        React.createElement(Text, { testID: 'Text-113', style: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, resource.name),
        React.createElement(Text, { testID: 'Text-114', style: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 20 } }, resource.desc)
      ),
      React.createElement(MaterialIcons, { testID: 'MaterialIcons-24', name: 'arrow-forward-ios', size: 16, color: theme.colors.textSecondary })
    );
  };

  return React.createElement(View, { testID: 'View-106', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-10', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-107', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-115', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Parent Community'),
        React.createElement(Text, { testID: 'Text-116', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Connect with other parents and find local support near you')
      ),

      React.createElement(View, { testID: 'View-108', style: { backgroundColor: '#E8836A', borderRadius: 16, margin: 20, marginTop: 8, padding: 20, alignItems: 'center' }
      },
        React.createElement(Text, { testID: 'Text-117', style: { fontSize: 22 } }, '🤝'),
        React.createElement(Text, { testID: 'Text-118', style: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 8, marginBottom: 6, textAlign: 'center' } }, 'You are not alone'),
        React.createElement(Text, { testID: 'Text-119', style: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22 } },
          'Thousands of parents around the world are going through exactly what you are facing right now. Connecting with them can change everything.'
        )
      ),

      React.createElement(View, { testID: 'View-109', style: { paddingHorizontal: 20, marginBottom: 8 } },
        React.createElement(Text, { testID: 'Text-120', style: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Online Support Groups'),
        React.createElement(Text, { testID: 'Text-121', style: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 20 } },
          'Safe, moderated communities where parents share experiences, advice, and encouragement.'
        ),
        onlineGroups.map(renderGroupCard)
      ),

      React.createElement(View, { testID: 'View-111', style: { backgroundColor: '#EBF2EC', borderRadius: 16, margin: 20, padding: 20, borderWidth: 1, borderColor: '#A8C4AA' }
      },
        React.createElement(Text, { testID: 'Text-124', style: { fontSize: 15, fontWeight: '600', color: '#3B5E3D', marginBottom: 8 } }, '💡 Tips for joining online groups'),
        React.createElement(Text, { testID: 'Text-125', style: { fontSize: 14, color: '#5A5750', lineHeight: 22 } },
          '• Read posts for a few days before sharing your own story\n• You don\'t have to share details you\'re not comfortable with\n• These groups are for support — not medical advice\n• If a group feels negative or unhelpful, it\'s okay to leave'
        )
      ),

      React.createElement(View, { testID: 'View-112', style: { backgroundColor: '#5C7A5F', borderRadius: 16, margin: 20, marginTop: 0, padding: 20, alignItems: 'center' }
      },
        React.createElement(Text, { testID: 'Text-126', style: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8, textAlign: 'center' } }, 'Need to talk right now?'),
        React.createElement(Text, { testID: 'Text-127', style: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
          'The eating disorder helpline connects you with a trained specialist who understands what you\'re going through.'
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-22', style: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 40 },
          onPress: function() { Linking.openURL('tel:18666621235'); }
        },
          React.createElement(Text, { testID: 'Text-128', style: { color: '#5C7A5F', fontSize: 15, fontWeight: '600' } }, 'Call 1-866-662-1235')
        )
      )
    )
  );
};
// @end:CommunityScreen

// @section:CopingScreen @depends:[ThemeContext,styles]
const CopingScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('breathing');
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingAnswers, setGroundingAnswers] = useState(['','','','','','','','','','','','','','','']);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [phase, setPhase] = useState('ready');
  const [count, setCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const animatedSize = useRef(new (require('react-native').Animated.Value)(120)).current;
  const animatedOpacity = useRef(new (require('react-native').Animated.Value)(0.4)).current;
  const intervalRef = useRef(null);
  const MIN_SIZE = 120;
  const MAX_SIZE = 220;

  const tabs = [
    { key: 'breathing', label: 'Breathing', icon: 'air' },
    { key: 'grounding', label: 'Grounding', icon: 'self-improvement' },
    { key: 'affirmations', label: 'Affirmations', icon: 'favorite' },
    { key: 'activities', label: 'Activities', icon: 'emoji-emotions' }
  ];

  const affirmations = [
    { text: 'You are more than your body.', color: '#5C7A5F' },
    { text: 'Recovery is possible for you.', color: '#6A9BB8' },
    { text: 'You deserve love exactly as you are.', color: '#E8836A' },
    { text: 'Your feelings are valid and they will pass.', color: '#9B6AB0' },
    { text: 'You are not defined by what you eat.', color: '#5C7A5F' },
    { text: 'Asking for help is an act of courage.', color: '#6A9BB8' },
    { text: 'Your worth has nothing to do with your weight.', color: '#E8836A' },
    { text: 'Every small step forward counts.', color: '#9B6AB0' },
    { text: 'You are allowed to take up space.', color: '#5C7A5F' },
    { text: 'Today does not have to be perfect.', color: '#6A9BB8' },
    { text: 'You have survived every hard day so far.', color: '#E8836A' },
    { text: 'Your body is doing its best for you.', color: '#9B6AB0' },
    { text: 'You are not alone in this.', color: '#5C7A5F' },
    { text: 'It is okay to rest. It is okay to heal slowly.', color: '#6A9BB8' },
    { text: 'You are worthy of a full and joyful life.', color: '#E8836A' }
  ];

  const groundingSteps = [
    { number: 5, sense: 'SEE', prompt: 'Name 5 things you can see right now', color: '#5C7A5F', examples: 'e.g. a lamp, a window, your hands, a book, the ceiling' },
    { number: 4, sense: 'TOUCH', prompt: 'Name 4 things you can physically feel', color: '#6A9BB8', examples: 'e.g. the chair beneath you, your clothes, the floor under your feet' },
    { number: 3, sense: 'HEAR', prompt: 'Name 3 things you can hear right now', color: '#9B6AB0', examples: 'e.g. traffic outside, your own breathing, a fan, music' },
    { number: 2, sense: 'SMELL', prompt: 'Name 2 things you can smell', color: '#E8836A', examples: 'e.g. your shampoo, food cooking, fresh air, a candle' },
    { number: 1, sense: 'TASTE', prompt: 'Name 1 thing you can taste', color: '#BA7517', examples: 'e.g. toothpaste, a drink, your lip balm' }
  ];

const activities = [
    { icon: '🎵', title: 'Calming playlists', desc: 'Spotify has free anxiety relief and mood-lifting playlists designed for teens.', url: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY', linkLabel: 'Open Spotify' },
    { icon: '🎧', title: 'Headspace for teens', desc: 'Free guided meditations for stress and anxiety.', url: 'https://www.headspace.com', linkLabel: 'Open Headspace' },
    { icon: '📚', title: 'Free audiobooks — Libby', desc: 'Free audiobooks with any library card. Thousands of titles for teens.', url: 'https://libbyapp.com', linkLabel: 'Open Libby' },
    { icon: '🎨', title: 'Online colouring', desc: 'Recolor is a free calming colouring app — no skill needed.', url: 'https://recolor.me', linkLabel: 'Open Recolor' },
    { icon: '🧘', title: 'Calm app', desc: 'Calm has sleep stories, meditations, and breathing exercises for teens.', url: 'https://www.calm.com', linkLabel: 'Open Calm' },
    { icon: '📖', title: 'Recovery stories on YouTube', desc: 'Real young people sharing their recovery journeys.', url: 'https://www.youtube.com/results?search_query=eating+disorder+recovery+story+teen', linkLabel: 'Watch stories' },
    { icon: '🌿', title: 'Nature sounds', desc: 'Calming rain, forest, and ocean sounds — free on YouTube.', url: 'https://www.youtube.com/watch?v=eKFTSSKCzWA', linkLabel: 'Listen now' },
    { icon: '✍️', title: 'Creative writing prompts', desc: 'Free writing prompts for teens to spark creativity.', url: 'https://blog.reedsy.com/creative-writing-prompts/for-teens/', linkLabel: 'Get prompts' },
    { icon: '🎬', title: 'Feel-good movies for teens', desc: 'Curated list of uplifting films for teens from Common Sense Media.', url: 'https://www.commonsensemedia.org/movie-lists', linkLabel: 'See the list' },
    { icon: '💬', title: 'Crisis Text Line', desc: 'Text HOME to 741741 for free 24/7 support from a trained counselor.', url: 'https://www.crisistextline.org', linkLabel: 'Learn more' }
  ];

  const getPhaseColor = function() {
    if (phase === 'inhale') return '#5C7A5F';
    if (phase === 'hold') return '#6A9BB8';
    if (phase === 'exhale') return '#E8836A';
    return '#A8C4AA';
  };

  const getPhaseText = function() {
    if (phase === 'ready') return 'Tap Start to begin';
    if (phase === 'inhale') return 'Breathe in... ' + count;
    if (phase === 'hold') return 'Hold... ' + count;
    if (phase === 'exhale') return 'Breathe out... ' + count;
    return '';
  };

  const runPhase = function(phaseName, duration, targetSize, targetOpacity, nextPhase) {
    setPhase(phaseName);
    setCount(Math.round(duration / 1000));
    require('react-native').Animated.parallel([
      require('react-native').Animated.timing(animatedSize, { toValue: targetSize, duration: duration, useNativeDriver: false }),
      require('react-native').Animated.timing(animatedOpacity, { toValue: targetOpacity, duration: duration, useNativeDriver: false })
    ]).start();
    var elapsed = 0;
    intervalRef.current = setInterval(function() {
      elapsed += 1000;
      var remaining = Math.round((duration - elapsed) / 1000);
      setCount(remaining > 0 ? remaining : 0);
      if (elapsed >= duration) {
        clearInterval(intervalRef.current);
        if (nextPhase) nextPhase();
      }
    }, 1000);
  };

  const startCycle = function() {
    var runExhale = function() { runPhase('exhale', 4000, MIN_SIZE, 0.4, function() { runInhale(); }); };
    var runHold = function() { runPhase('hold', 4000, MAX_SIZE, 1, function() { runExhale(); }); };
    var runInhale = function() { runPhase('inhale', 4000, MAX_SIZE, 1, function() { runHold(); }); };
    runInhale();
  };

  const handleStart = function() {
    setIsRunning(true);
    startCycle();
  };

  const handleStop = function() {
    setIsRunning(false);
    setPhase('ready');
    setCount(0);
    clearInterval(intervalRef.current);
    require('react-native').Animated.parallel([
      require('react-native').Animated.timing(animatedSize, { toValue: MIN_SIZE, duration: 500, useNativeDriver: false }),
      require('react-native').Animated.timing(animatedOpacity, { toValue: 0.4, duration: 500, useNativeDriver: false })
    ]).start();
  };

  useEffect(function() {
    return function() { clearInterval(intervalRef.current); };
  }, []);

  const Animated = require('react-native').Animated;

  const currentGrounding = groundingStep < groundingSteps.length ? groundingSteps[groundingStep] : null;

  return React.createElement(View, { testID: 'View-137', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-11', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-138', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-152', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'Coping Toolkit'),
        React.createElement(Text, { testID: 'Text-153', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'Tools to help you feel calmer and more in control')
      ),

      React.createElement(View, { testID: 'View-139', style: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: theme.colors.card, borderRadius: 12, padding: 4, borderWidth: 1, borderColor: theme.colors.border }
      },
        tabs.map(function(tab) {
          var isActive = activeTab === tab.key;
          return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-24', key: tab.key,
            style: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: isActive ? '#E8836A' : 'transparent' },
            onPress: function() { setActiveTab(tab.key); }
          },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-25', name: tab.icon, size: 18, color: isActive ? '#fff' : theme.colors.textSecondary }),
            React.createElement(Text, { testID: 'Text-154', style: { fontSize: 10, fontWeight: '500', color: isActive ? '#fff' : theme.colors.textSecondary, marginTop: 2 } }, tab.label)
          );
        })
      ),

      activeTab === 'breathing' ?
        React.createElement(View, { testID: 'View-140', style: { paddingHorizontal: 20 } },
          React.createElement(View, { testID: 'View-141', style: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, minHeight: 320 } },
            React.createElement(View, { testID: 'View-142', style: { width: MAX_SIZE + 60, height: MAX_SIZE + 60, alignItems: 'center', justifyContent: 'center' } },
              React.createElement(Animated.View, { testID: 'View-143', style: { width: animatedSize, height: animatedSize, borderRadius: MAX_SIZE, backgroundColor: getPhaseColor(), opacity: animatedOpacity, alignItems: 'center', justifyContent: 'center' }
              },
                React.createElement(Text, { testID: 'Text-155', style: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' } }, count > 0 ? count.toString() : '')
              )
            ),
            React.createElement(Text, { testID: 'Text-156', style: { fontSize: 22, fontWeight: '600', color: phase === 'ready' ? theme.colors.textSecondary : getPhaseColor(), textAlign: 'center', marginTop: 20, marginBottom: 6 } }, getPhaseText()),
            React.createElement(Text, { testID: 'Text-157', style: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 } },
              phase === 'ready' ? 'Box breathing — 4 counts in, 4 hold, 4 out' :
              phase === 'inhale' ? 'Slowly breathe in through your nose' :
              phase === 'hold' ? 'Hold your breath gently' : 'Slowly breathe out through your mouth'
            )
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-25', style: { backgroundColor: isRunning ? '#E8836A' : '#5C7A5F', paddingVertical: 16, borderRadius: 40, alignItems: 'center', marginBottom: 20 },
            onPress: isRunning ? handleStop : handleStart
          },
            React.createElement(Text, { testID: 'Text-158', style: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' } }, isRunning ? 'Stop' : 'Start Breathing')
          )
        )
      : activeTab === 'grounding' ?
        React.createElement(View, { testID: 'View-144', style: { paddingHorizontal: 20 } },
          groundingStep === 0 && React.createElement(View, { testID: 'View-145', style: { backgroundColor: '#EBF2EC', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#A8C4AA', alignItems: 'center' }
          },
            React.createElement(Text, { testID: 'Text-159', style: { fontSize: 18, fontWeight: '600', color: '#3B5E3D', marginBottom: 8 } }, '5-4-3-2-1 Grounding'),
            React.createElement(Text, { testID: 'Text-160', style: { fontSize: 14, color: '#5A5750', textAlign: 'center', lineHeight: 22, marginBottom: 16 } },
              'This technique helps bring you back to the present moment when anxiety or difficult feelings feel overwhelming. Work through each sense one at a time.'
            ),
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-26', style: { backgroundColor: '#5C7A5F', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 40 },
              onPress: function() { setGroundingStep(1); setGroundingAnswers(['','','','','','','','','','','','','','','']); }
            },
              React.createElement(Text, { testID: 'Text-161', style: { color: '#fff', fontSize: 16, fontWeight: '600' } }, 'Start Grounding Exercise')
            )
          ),

          groundingStep > 0 && groundingStep <= 5 && currentGrounding ?
            React.createElement(View, { testID: 'View-146' },
              React.createElement(View, { testID: 'View-147', style: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 } },
                [1,2,3,4,5].map(function(step) {
                  return React.createElement(View, { testID: 'View-148', key: step,
                    style: { width: 32, height: 32, borderRadius: 16, backgroundColor: step <= groundingStep ? currentGrounding.color : theme.colors.border, alignItems: 'center', justifyContent: 'center' }
                  },
                    React.createElement(Text, { testID: 'Text-162', style: { color: step <= groundingStep ? '#fff' : theme.colors.textSecondary, fontSize: 13, fontWeight: '600' } }, step.toString())
                  );
                })
              ),
              React.createElement(View, { testID: 'View-149', style: { backgroundColor: currentGrounding.color, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 }
              },
                React.createElement(Text, { testID: 'Text-163', style: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginBottom: 4 } }, currentGrounding.number.toString()),
                React.createElement(Text, { testID: 'Text-164', style: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, letterSpacing: 2 } }, currentGrounding.sense),
                React.createElement(Text, { testID: 'Text-165', style: { fontSize: 16, color: 'rgba(255,255,255,0.95)', textAlign: 'center', lineHeight: 24 } }, currentGrounding.prompt),
                React.createElement(Text, { testID: 'Text-166', style: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 8, fontStyle: 'italic' } }, currentGrounding.examples)
              ),
              Array.from({ length: currentGrounding.number }).map(function(_, i) {
                var answerIndex = (groundingStep - 1) * 3 + i;
                return React.createElement(View, { testID: 'View-150', key: i,
                  style: { backgroundColor: theme.colors.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: theme.colors.border }
                },
                  React.createElement(View, { testID: 'View-151', style: { width: 28, height: 28, borderRadius: 14, backgroundColor: currentGrounding.color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }
                  },
                    React.createElement(Text, { testID: 'Text-167', style: { color: '#fff', fontSize: 13, fontWeight: '600' } }, (i + 1).toString())
                  ),
                  React.createElement(require('react-native').TextInput, {
                    style: { flex: 1, fontSize: 15, color: theme.colors.textPrimary },
                    placeholder: 'Write it here...',
                    placeholderTextColor: theme.colors.textSecondary,
                    value: groundingAnswers[answerIndex],
                    onChangeText: function(text) {
                      var newAnswers = groundingAnswers.slice();
                      newAnswers[answerIndex] = text;
                      setGroundingAnswers(newAnswers);
                    }
                  })
                );
              }),
              React.createElement(View, { testID: 'View-152', style: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 } },
                groundingStep > 1 && React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-27', style: { flex: 1, backgroundColor: theme.colors.card, paddingVertical: 14, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
                  onPress: function() { setGroundingStep(groundingStep - 1); }
                },
                  React.createElement(Text, { testID: 'Text-168', style: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '500' } }, '← Back')
                ),
                React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-28', style: { flex: 1, backgroundColor: currentGrounding.color, paddingVertical: 14, borderRadius: 40, alignItems: 'center' },
                  onPress: function() {
                    if (groundingStep < 5) { setGroundingStep(groundingStep + 1); }
                    else { setGroundingStep(6); }
                  }
                },
                  React.createElement(Text, { testID: 'Text-169', style: { color: '#fff', fontSize: 15, fontWeight: '600' } }, groundingStep < 5 ? 'Next →' : 'Finish ✓')
                )
              )
            )
          : groundingStep === 6 ?
            React.createElement(View, { testID: 'View-153', style: { alignItems: 'center', padding: 20 } },
              React.createElement(Text, { testID: 'Text-170', style: { fontSize: 48, marginBottom: 16 } }, '🌿'),
              React.createElement(Text, { testID: 'Text-171', style: { fontSize: 22, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'center' } }, 'Well done!'),
              React.createElement(Text, { testID: 'Text-172', style: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 28 } },
                'You just completed the 5-4-3-2-1 grounding exercise. Take a moment to notice how you feel right now compared to when you started.'
              ),
              React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-29', style: { backgroundColor: '#5C7A5F', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 40, marginBottom: 12 },
                onPress: function() { setGroundingStep(0); }
              },
                React.createElement(Text, { testID: 'Text-173', style: { color: '#fff', fontSize: 16, fontWeight: '600' } }, 'Do it again')
              ),
              React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-30', style: { backgroundColor: theme.colors.card, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 40, borderWidth: 1, borderColor: theme.colors.border },
                onPress: function() { setGroundingStep(0); setActiveTab('activities'); }
              },
                React.createElement(Text, { testID: 'Text-174', style: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '500' } }, 'Try another activity')
              )
            )
          : null
        )
      : activeTab === 'affirmations' ?
        React.createElement(View, { testID: 'View-154', style: { paddingHorizontal: 20 } },
          React.createElement(View, { testID: 'View-155', style: { backgroundColor: affirmations[affirmationIndex].color, borderRadius: 24, padding: 40, alignItems: 'center', marginBottom: 24, minHeight: 200, justifyContent: 'center' }
          },
            React.createElement(Text, { testID: 'Text-175', style: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center', lineHeight: 36 } },
              affirmations[affirmationIndex].text
            )
          ),
          React.createElement(View, { testID: 'View-156', style: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 } },
            affirmations.map(function(_, i) {
              return React.createElement(View, { testID: 'View-157', key: i,
                style: { width: i === affirmationIndex ? 20 : 8, height: 8, borderRadius: 4, backgroundColor: i === affirmationIndex ? '#5C7A5F' : theme.colors.border }
              });
            })
          ),
          React.createElement(View, { testID: 'View-158', style: { flexDirection: 'row', gap: 12, marginBottom: 24 } },
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-31', style: { flex: 1, backgroundColor: theme.colors.card, paddingVertical: 14, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
              onPress: function() { setAffirmationIndex(affirmationIndex > 0 ? affirmationIndex - 1 : affirmations.length - 1); }
            },
              React.createElement(Text, { testID: 'Text-176', style: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '500' } }, '← Previous')
            ),
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-32', style: { flex: 1, backgroundColor: '#5C7A5F', paddingVertical: 14, borderRadius: 40, alignItems: 'center' },
              onPress: function() { setAffirmationIndex(affirmationIndex < affirmations.length - 1 ? affirmationIndex + 1 : 0); }
            },
              React.createElement(Text, { testID: 'Text-177', style: { color: '#fff', fontSize: 15, fontWeight: '600' } }, 'Next →')
            )
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-33', style: { backgroundColor: theme.colors.card, paddingVertical: 14, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, marginBottom: 20 },
            onPress: function() { setAffirmationIndex(Math.floor(Math.random() * affirmations.length)); }
          },
            React.createElement(Text, { testID: 'Text-178', style: { color: theme.colors.textSecondary, fontSize: 15 } }, '✨ Random affirmation')
          ),
          React.createElement(View, { testID: 'View-159', style: { backgroundColor: '#EBF2EC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#A8C4AA', marginBottom: 20 }
          },
            React.createElement(Text, { testID: 'Text-179', style: { fontSize: 14, color: '#3B5E3D', lineHeight: 22, textAlign: 'center' } },
              '💚 Tip: Choose one affirmation that feels true — even just a little. Read it out loud. Write it somewhere you\'ll see it today.'
            )
          )
        )
      :
        React.createElement(View, { testID: 'View-160', style: { paddingHorizontal: 20 } },
          React.createElement(Text, { testID: 'Text-180', style: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 22 } },
            'When feelings are intense, doing something — anything — can help break the cycle. Try one of these:'
          ),
          activities.map(function(activity, index) {
            return React.createElement(View, { testID: 'View-160', key: index,
              style: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border }
            },
              React.createElement(View, { testID: 'View-161', style: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: activity.url ? 10 : 0 } },
                React.createElement(Text, { testID: 'Text-183', style: { fontSize: 28, flexShrink: 0 } }, activity.icon),
                React.createElement(View, { testID: 'View-162', style: { flex: 1 } },
                  React.createElement(Text, { testID: 'Text-184', style: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 } }, activity.title),
                  React.createElement(Text, { testID: 'Text-185', style: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22 } }, activity.desc)
                )
              ),
              activity.url ? React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-38', style: { backgroundColor: '#EBF2EC', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, alignSelf: 'flex-start', marginLeft: 42, flexDirection: 'row', alignItems: 'center', gap: 6 },
                onPress: function() { Linking.openURL(activity.url); }
              },
                React.createElement(MaterialIcons, { testID: 'MaterialIcons-30', name: 'open-in-new', size: 14, color: '#5C7A5F' }),
                React.createElement(Text, { testID: 'Text-186', style: { fontSize: 12, fontWeight: '500', color: '#5C7A5F' } }, activity.linkLabel)
              ) : null
            );
          }),
          React.createElement(View, { testID: 'View-163', style: { backgroundColor: '#FDF0EC', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#F4B5A2', alignItems: 'center' }
          },
            React.createElement(Text, { testID: 'Text-184', style: { fontSize: 15, color: '#993C1D', lineHeight: 22, textAlign: 'center' } },
              '🧡 If nothing is helping and you\'re feeling unsafe, please reach out. Call 1-866-662-1235 or text HOME to 741741.'
            )
          )
        )
    )
  );
};
// @end:CopingScreen

// @section:JournalScreen @depends:[ThemeContext,styles]
const JournalScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [view, setView] = useState('list');
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [entryText, setEntryText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const DATA_HEADERS = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + token
  };

  const prompts = [
    'What made today hard?',
    'What am I proud of today?',
    'What am I feeling right now and where do I feel it in my body?',
    'What is one thing I did today to take care of myself?',
    'What would I say to a friend going through what I\'m going through?',
    'What am I afraid of? What would help me feel less afraid?',
    'What does recovery mean to me today?',
    'Who in my life makes me feel safe? Why?',
    'What is one small thing I can do tomorrow to be kind to myself?',
    'If I could write a letter to my future self, what would I say?',
    'What are three things I am grateful for today, even small ones?',
    'What is something I wish people understood about what I\'m going through?'
  ];

  const loadEntries = function() {
    if (!token) return;
    setIsLoading(true);
    fetch(SUPABASE_URL + '/rest/v1/journal_entries?order=created_at.desc', {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data)) setEntries(data);
      setIsLoading(false);
    })
    .catch(function() {
      setIsLoading(false);
    });
  };

  const saveEntries = function(newEntries) {
    setEntries(newEntries);
  };

  useEffect(function() {
    loadEntries();
  }, [token]);

  const handleNewEntry = function(prompt) {
    setSelectedPrompt(prompt || null);
    setEntryText(prompt ? prompt + '\n\n' : '');
    setCurrentEntry(null);
    setView('write');
  };

  const handleSave = function() {
    if (!entryText.trim()) return;
    if (!token) {
      alert('Session expired. Please log out and log in again.');
      return;
    }
    var now = new Date();
    var entry = {
      text: entryText.trim(),
      prompt: selectedPrompt || null,
      date_display: now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time_display: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      user_id: user.id
    };

    fetch(SUPABASE_URL + '/rest/v1/journal_entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(entry)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (Array.isArray(data) && data.length > 0) {
        setEntries(function(prev) { return [data[0]].concat(prev); });
      }
      setView('list');
      setEntryText('');
      setSelectedPrompt(null);
      setCurrentEntry(null);
    })
    .catch(function() {
      setView('list');
    });
  };

  const handleDeleteEntry = function(id) {
    setEntries(function(prev) { return prev.filter(function(e) { return e.id !== id; }); });
    fetch(SUPABASE_URL + '/rest/v1/journal_entries?id=eq.' + id, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + token
      }
    })
    .catch(function() {});
    setView('list');
  };

  const handleViewEntry = function(entry) {
    setCurrentEntry(entry);
    setEntryText(entry.text);
    setSelectedPrompt(entry.prompt);
    setView('read');
  };

  const handleEditEntry = function() {
    setView('write');
  };

  const getPreview = function(text) {
    var clean = text.replace(/\n/g, ' ');
    return clean.length > 80 ? clean.substring(0, 80) + '...' : clean;
  };

  const getMoodColor = function(index) {
    var colors = ['#5C7A5F', '#6A9BB8', '#9B6AB0', '#E8836A', '#BA7517'];
    return colors[index % colors.length];
  };

  if (view === 'write') {
    return React.createElement(View, { testID: 'View-150', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top } },
      React.createElement(View, { testID: 'View-151', style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }
      },
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-33', onPress: function() { setView('list'); setEntryText(''); } },
          React.createElement(Text, { testID: 'Text-172', style: { fontSize: 15, color: '#E8836A', fontWeight: '500' } }, 'Cancel')
        ),
        React.createElement(Text, { testID: 'Text-173', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary } }, currentEntry ? 'Edit Entry' : 'New Entry'),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-34', onPress: handleSave,
          style: { backgroundColor: entryText.trim() ? '#5C7A5F' : theme.colors.border, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }
        },
          React.createElement(Text, { testID: 'Text-174', style: { fontSize: 15, color: '#fff', fontWeight: '600' } }, 'Save')
        )
      ),
      selectedPrompt ?
        React.createElement(View, { testID: 'View-152', style: { backgroundColor: '#EBF2EC', padding: 14, borderBottomWidth: 1, borderBottomColor: '#A8C4AA' } },
          React.createElement(Text, { testID: 'Text-175', style: { fontSize: 13, color: '#3B5E3D', fontStyle: 'italic' } }, '💭 ' + selectedPrompt)
        ) : null,
      React.createElement(require('react-native').TextInput, {
        style: { flex: 1, padding: 20, fontSize: 16, color: theme.colors.textPrimary, lineHeight: 26, textAlignVertical: 'top', backgroundColor: theme.colors.background },
        multiline: true,
        value: entryText,
        onChangeText: setEntryText,
        placeholder: 'Write freely here. This is your private space — no one else can read this...',
        placeholderTextColor: theme.colors.textSecondary,
        autoFocus: true
      }),
      React.createElement(View, { testID: 'View-153', style: { padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.card, paddingBottom: insets.bottom + 16 }
      },
        React.createElement(Text, { testID: 'Text-176', style: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' } },
          '🔒 Your journal is saved only on this device and is completely private'
        )
      )
    );
  }

  if (view === 'read' && currentEntry) {
    return React.createElement(View, { testID: 'View-154', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top } },
      React.createElement(View, { testID: 'View-155', style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }
      },
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-35', onPress: function() { setView('list'); } },
          React.createElement(MaterialIcons, { testID: 'MaterialIcons-26', name: 'arrow-back', size: 24, color: theme.colors.textPrimary })
        ),
        React.createElement(Text, { testID: 'Text-177', style: { fontSize: 15, color: theme.colors.textSecondary } }, currentEntry.date_display || currentEntry.dateDisplay),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-36', onPress: handleEditEntry },
          React.createElement(Text, { testID: 'Text-178', style: { fontSize: 15, color: '#5C7A5F', fontWeight: '500' } }, 'Edit')
        )
      ),
      React.createElement(ScrollView, { testID: 'ScrollView-11', contentContainerStyle: { padding: 20, paddingBottom: insets.bottom + 80 } },
        currentEntry.prompt ?
          React.createElement(View, { testID: 'View-156', style: { backgroundColor: '#EBF2EC', borderRadius: 10, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#A8C4AA' } },
            React.createElement(Text, { testID: 'Text-179', style: { fontSize: 13, color: '#3B5E3D', fontStyle: 'italic' } }, '💭 ' + currentEntry.prompt)
          ) : null,
        React.createElement(Text, { testID: 'Text-180', style: { fontSize: 16, color: theme.colors.textPrimary, lineHeight: 28 } }, currentEntry.text),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-37', style: { marginTop: 40, backgroundColor: '#FCEBEB', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F7C1C1' },
          onPress: function() { handleDeleteEntry(currentEntry.id); }
        },
          React.createElement(Text, { testID: 'Text-181', style: { color: '#A32D2D', fontSize: 15, fontWeight: '500' } }, '🗑 Delete this entry')
        )
      )
    );
  }

  return React.createElement(View, { testID: 'View-157', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-12', contentContainerStyle: { flexGrow: 1, paddingBottom: TAB_MENU_HEIGHT + insets.bottom + 20 }
    },
      React.createElement(View, { testID: 'View-158', style: { padding: 20, paddingBottom: 8 } },
        React.createElement(Text, { testID: 'Text-182', style: { fontSize: 28, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 4 } }, 'My Journal'),
        React.createElement(Text, { testID: 'Text-183', style: { fontSize: 16, color: theme.colors.textSecondary, lineHeight: 22 } }, 'A private space just for you — no one else can read this')
      ),

      React.createElement(View, { testID: 'View-159', style: { backgroundColor: '#EBF2EC', borderRadius: 16, marginHorizontal: 20, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: '#A8C4AA', flexDirection: 'row', alignItems: 'center', gap: 12 }
      },
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-27', name: 'lock', size: 20, color: '#5C7A5F' }),
        React.createElement(Text, { testID: 'Text-184', style: { fontSize: 13, color: '#3B5E3D', lineHeight: 20, flex: 1 } },
          'Your journal entries are saved only on this device. They are never shared, uploaded, or seen by anyone else.'
        )
      ),

      React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-38', style: { backgroundColor: '#5C7A5F', marginHorizontal: 20, marginBottom: 20, paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
        onPress: function() { handleNewEntry(null); }
      },
        React.createElement(MaterialIcons, { testID: 'MaterialIcons-28', name: 'edit', size: 22, color: '#fff' }),
        React.createElement(Text, { testID: 'Text-185', style: { color: '#fff', fontSize: 17, fontWeight: '600' } }, 'Write a new entry')
      ),

      React.createElement(View, { testID: 'View-160', style: { paddingHorizontal: 20, marginBottom: 8 } },
        React.createElement(Text, { testID: 'Text-186', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 } }, '💭 Need a prompt?'),
        React.createElement(ScrollView, { testID: 'ScrollView-13', horizontal: true, showsHorizontalScrollIndicator: false, style: { marginHorizontal: -20, paddingHorizontal: 20 } },
          prompts.map(function(prompt, index) {
            return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-39', key: index,
              style: {
                backgroundColor: theme.colors.card,
                borderRadius: 14,
                padding: 14,
                marginRight: 10,
                width: 200,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderLeftWidth: 3,
                borderLeftColor: getMoodColor(index)
              },
              onPress: function() { handleNewEntry(prompt); }
            },
              React.createElement(Text, { testID: 'Text-187', style: { fontSize: 13, color: theme.colors.textPrimary, lineHeight: 20 } }, prompt),
              React.createElement(Text, { testID: 'Text-188', style: { fontSize: 11, color: getMoodColor(index), marginTop: 8, fontWeight: '500' } }, 'Tap to use this prompt →')
            );
          })
        )
      ),

      entries.length === 0 ?
        React.createElement(View, { testID: 'View-161', style: { alignItems: 'center', padding: 40 } },
          React.createElement(Text, { testID: 'Text-189', style: { fontSize: 40, marginBottom: 16 } }, '📓'),
          React.createElement(Text, { testID: 'Text-190', style: { fontSize: 18, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8, textAlign: 'center' } }, 'Your journal is empty'),
          React.createElement(Text, { testID: 'Text-191', style: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 22 } },
            'Write your first entry above, or choose a prompt to get started. Everything here is just for you.'
          )
        )
      :
        React.createElement(View, { testID: 'View-162', style: { paddingHorizontal: 20, marginTop: 20 } },
          React.createElement(Text, { testID: 'Text-192', style: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 12 } }, 'Your entries (' + entries.length + ')'),
          entries.map(function(entry, index) {
            return React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-40', key: entry.id,
              style: {
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderLeftWidth: 4,
                borderLeftColor: getMoodColor(index)
              },
              onPress: function() { handleViewEntry(entry); }
            },
              React.createElement(View, { testID: 'View-163', style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } },
                React.createElement(Text, { testID: 'Text-193', style: { fontSize: 12, fontWeight: '500', color: getMoodColor(index) } }, entry.date_display || entry.dateDisplay),
                React.createElement(Text, { testID: 'Text-194', style: { fontSize: 12, color: theme.colors.textSecondary } }, entry.time_display || entry.timeDisplay)
              ),
              entry.prompt ?
                React.createElement(Text, { testID: 'Text-195', style: { fontSize: 12, color: theme.colors.textSecondary, fontStyle: 'italic', marginBottom: 6 } }, '💭 ' + entry.prompt) : null,
              React.createElement(Text, { testID: 'Text-196', style: { fontSize: 14, color: theme.colors.textPrimary, lineHeight: 22 } }, getPreview(entry.text))
            );
          })
        )
    )
  );
};
// @end:JournalScreen
  
// @section:LoginScreen @depends:[ThemeContext,styles]
const LoginScreen = function() {
  const themeContext = useTheme();
  const theme = themeContext.theme;
  const insets = useSafeAreaInsets();
  const { login, signup, authLoading, setSavedRole } = useAuth();
  const { setUserRole } = useUserRole();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('parent');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = function() {
    setError('');
    setSuccess('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (isLogin) {
      login(email.trim(), password)
        .then(function(data) {
          setUserRole(data.role || 'parent');
        })
        .catch(function(err) {
          setError('Incorrect email or password. Please try again.');
        });
    } else {
      signup(email.trim(), password, selectedRole)
        .then(function(data) {
          if (data.user) {
            setUserRole(selectedRole);
          } else {
            setError(data.error || 'Something went wrong.');
          }
        })
        .catch(function(err) {
          setError(err.message || 'Something went wrong.');
        });
    }
  };

  return React.createElement(View, { testID: 'View-183', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }
  },
    React.createElement(ScrollView, { testID: 'ScrollView-14', contentContainerStyle: { flexGrow: 1, justifyContent: 'center', padding: 28 }
    },
      React.createElement(View, { testID: 'View-184', style: { alignItems: 'center', marginBottom: 32 } },
        React.createElement(Text, { testID: 'Text-220', style: { fontSize: 32, marginBottom: 8 } }, '🌿'),
        React.createElement(Text, { testID: 'Text-221', style: { fontSize: 28, fontWeight: 'bold', color: '#5C7A5F', marginBottom: 4 } }, 'Nourish & Hope'),
        React.createElement(Text, { testID: 'Text-222', style: { fontSize: 15, color: theme.colors.textSecondary, textAlign: 'center' } },
          isLogin ? 'Welcome back' : 'Create your free account'
        )
      ),

      React.createElement(View, { testID: 'View-185', style: { flexDirection: 'row', backgroundColor: theme.colors.card, borderRadius: 12, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: theme.colors.border }
      },
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-50', style: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: isLogin ? '#5C7A5F' : 'transparent' },
          onPress: function() { setIsLogin(true); setError(''); setSuccess(''); }
        },
          React.createElement(Text, { testID: 'Text-223', style: { fontSize: 14, fontWeight: '500', color: isLogin ? '#fff' : theme.colors.textSecondary } }, 'Log in')
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-51', style: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: !isLogin ? '#5C7A5F' : 'transparent' },
          onPress: function() { setIsLogin(false); setError(''); setSuccess(''); }
        },
          React.createElement(Text, { testID: 'Text-224', style: { fontSize: 14, fontWeight: '500', color: !isLogin ? '#fff' : theme.colors.textSecondary } }, 'Sign up')
        )
      ),

      !isLogin ?
        React.createElement(View, { testID: 'View-186', style: { marginBottom: 16 } },
          React.createElement(Text, { testID: 'Text-225', style: { fontSize: 14, fontWeight: '500', color: theme.colors.textPrimary, marginBottom: 10 } }, 'I am a:'),
          React.createElement(View, { testID: 'View-187', style: { flexDirection: 'row', gap: 10 } },
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-52', style: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: selectedRole === 'parent' ? '#5C7A5F' : theme.colors.card, borderWidth: 1, borderColor: selectedRole === 'parent' ? '#5C7A5F' : theme.colors.border },
              onPress: function() { setSelectedRole('parent'); }
            },
              React.createElement(Text, { testID: 'Text-226', style: { fontSize: 13, fontWeight: '500', color: selectedRole === 'parent' ? '#fff' : theme.colors.textSecondary } }, '👨‍👩‍👧 Parent')
            ),
            React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-53', style: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: selectedRole === 'kid' ? '#E8836A' : theme.colors.card, borderWidth: 1, borderColor: selectedRole === 'kid' ? '#E8836A' : theme.colors.border },
              onPress: function() { setSelectedRole('kid'); }
            },
              React.createElement(Text, { testID: 'Text-227', style: { fontSize: 13, fontWeight: '500', color: selectedRole === 'kid' ? '#fff' : theme.colors.textSecondary } }, '🌸 Kid or Teen')
            )
          )
        ) : null,

      React.createElement(View, { testID: 'View-188', style: { marginBottom: 14 } },
        React.createElement(Text, { testID: 'Text-228', style: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary, marginBottom: 6 } }, 'Email'),
        React.createElement(require('react-native').TextInput, {
          style: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10, padding: 14, fontSize: 15, color: theme.colors.textPrimary, backgroundColor: '#FAF7F2' },
          placeholder: 'your@email.com',
          placeholderTextColor: theme.colors.textSecondary,
          value: email,
          onChangeText: setEmail,
          keyboardType: 'email-address',
          autoCapitalize: 'none'
        })
      ),

      React.createElement(View, { testID: 'View-189', style: { marginBottom: 14 } },
        React.createElement(Text, { testID: 'Text-229', style: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary, marginBottom: 6 } }, 'Password'),
        React.createElement(require('react-native').TextInput, {
          style: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10, padding: 14, fontSize: 15, color: theme.colors.textPrimary, backgroundColor: '#FAF7F2' },
          placeholder: 'At least 6 characters',
          placeholderTextColor: theme.colors.textSecondary,
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true
        })
      ),

      !isLogin ?
        React.createElement(View, { testID: 'View-190', style: { marginBottom: 14 } },
          React.createElement(Text, { testID: 'Text-230', style: { fontSize: 13, fontWeight: '500', color: theme.colors.textPrimary, marginBottom: 6 } }, 'Confirm Password'),
          React.createElement(require('react-native').TextInput, {
            style: { borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 10, padding: 14, fontSize: 15, color: theme.colors.textPrimary, backgroundColor: '#FAF7F2' },
            placeholder: 'Type your password again manually',
            placeholderTextColor: theme.colors.textSecondary,
            value: confirmPassword,
            onChangeText: setConfirmPassword,
            secureTextEntry: true,
            autoCorrect: false,
            autoComplete: 'off',
            textContentType: 'none'
          })
        ) : null,

      error ? React.createElement(View, { testID: 'View-191', style: { backgroundColor: '#FCEBEB', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F7C1C1' }
      },
        React.createElement(Text, { testID: 'Text-231', style: { fontSize: 13, color: '#A32D2D', lineHeight: 20 } }, error)
      ) : null,

      success ? React.createElement(View, { testID: 'View-192', style: { backgroundColor: '#EBF2EC', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#A8C4AA' }
      },
        React.createElement(Text, { testID: 'Text-232', style: { fontSize: 13, color: '#3B5E3D', lineHeight: 20 } }, success)
      ) : null,

      React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-54', style: { backgroundColor: '#5C7A5F', paddingVertical: 16, borderRadius: 40, alignItems: 'center', marginBottom: 20 },
        onPress: handleSubmit
      },
        React.createElement(Text, { testID: 'View-193', style: { color: '#fff', fontSize: 16, fontWeight: '600' } },
          isLogin ? 'Log in' : 'Create account'
        )
      ),

      React.createElement(View, { testID: 'View-193', style: { backgroundColor: '#EAF3F9', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#9EC4DA' }
      },
        React.createElement(Text, { testID: 'Text-234', style: { fontSize: 12, color: '#185FA5', textAlign: 'center', lineHeight: 18 } },
          '🔒 Your data is private and secure. Journal entries and meal records are only visible to you.'
        )
      ),

      React.createElement(View, { testID: 'View-194', style: { marginTop: 24, alignItems: 'center' } },
        React.createElement(Text, { testID: 'Text-235', style: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' } },
          'Crisis support always available:'
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-55', onPress: function() { Linking.openURL('tel:18666621235'); }
        },
          React.createElement(Text, { testID: 'Text-236', style: { fontSize: 13, color: '#5C7A5F', fontWeight: '500' } }, '1-866-662-1235')
        )
      )
    )
  );
};
// @end:LoginScreen

// @section:WelcomeScreen @depends:[]
const WelcomeScreen = function() {
    const navigation = useNavigation();
    const userRoleContext = useUserRole();
    const themeContext = useTheme();
    const theme = themeContext.theme;
    const insets = useSafeAreaInsets();

    const { setSavedRole } = useAuth();

    const handleParentSelection = function() {
      setSavedRole('parent');
    };

    const handleKidSelection = function() {
      setSavedRole('kid');
    };

    const handleCallCrisis = function() {
      if (Platform.OS === 'web') {
        window.open('tel:18666621235');
      } else {
        Linking.openURL('tel:18666621235');
      }
    };

    const handleChangeRole = function() {
      userRoleContext.setUserRole(null);
    };

    return React.createElement(View, { testID: 'View-welcome', style: { flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top, paddingBottom: insets.bottom } },
      React.createElement(ScrollView, { testID: 'ScrollView-welcome', style: { flex: 1 }, contentContainerStyle: { flexGrow: 1, justifyContent: 'space-evenly', paddingHorizontal: 20, paddingVertical: 20 } },
        userRoleContext.userRole && React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-welcome-back', style: { marginBottom: 8, alignSelf: 'flex-start' }, onPress: handleChangeRole },
          React.createElement(Text, { testID: 'Text-welcome-back', style: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' } }, '← Change Role')
        ),
        React.createElement(View, { testID: 'View-welcome-header', style: { alignItems: 'center' } },
          React.createElement(Text, { testID: 'Text-welcome-emoji', style: { fontSize: 48, marginBottom: 16 } }, '🌿'),
          React.createElement(Text, { testID: 'Text-welcome-title', style: [styles.appTitle, { color: primaryColor, marginBottom: 12 }] }, 'Nourish & Hope'),
          React.createElement(Text, { testID: 'Text-welcome-subtitle', style: [styles.welcomeText, { color: theme.colors.textSecondary, marginBottom: 40 }] }, 
            'A safe space for families navigating eating disorders'
          ),
          React.createElement(Text, { testID: 'Text-welcome-question', style: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 32, textAlign: 'center' } }, 
            'Who are you?'
          )
        ),
        React.createElement(View, { testID: 'View-welcome-buttons', style: { gap: 16, marginBottom: 40 } },
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-welcome-parent', style: [styles.mainButton, { backgroundColor: primaryColor }], onPress: handleParentSelection },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-welcome-parent', name: 'family-restroom', size: 32, color: '#FFFFFF' }),
            React.createElement(Text, { testID: 'Text-welcome-parent', style: styles.mainButtonText }, 'I am a Parent or Caregiver')
          ),
          React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-welcome-kid', style: [styles.mainButton, { backgroundColor: accentColor }], onPress: handleKidSelection },
            React.createElement(MaterialIcons, { testID: 'MaterialIcons-welcome-kid', name: 'favorite', size: 32, color: '#FFFFFF' }),
            React.createElement(Text, { testID: 'Text-welcome-kid', style: styles.mainButtonText }, 'I am a Kid or Teen')
          )
        ),
        React.createElement(TouchableOpacity, { testID: 'TouchableOpacity-welcome-crisis', onPress: handleCallCrisis },
          React.createElement(Text, { testID: 'Text-welcome-crisis', style: { fontSize: 13, color: theme.colors.primary, textAlign: 'center', fontWeight: '500' } }, 
            'Crisis support always available: 1-866-662-1235'
          )
        )
      )
    );
  };
// @end:WelcomeScreen

// @section:ParentTabNavigator @depends:[HomeScreen,ParentsScreen,ChatScreen,UnderstandingScreen,GetHelpScreen,navigation-setup]
const ParentTabNavigator = function() {
  var insets = useSafeAreaInsets();
  var themeContext = useTheme();
  var theme = themeContext.theme;
  return React.createElement(Tab.Navigator, { testID: 'Navigator-1', initialRouteName: 'Parents',
    screenOptions: {
      headerShown: false,
      tabBarStyle: { 
        position: 'absolute', 
        bottom: 0, 
        height: TAB_MENU_HEIGHT + insets.bottom, 
        borderTopWidth: 0, 
        backgroundColor: theme.colors.card 
      },
      tabBarItemStyle: { padding: 0 },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarLabelStyle: { fontSize: 10 }
    }
  },
React.createElement(Tab.Screen, { testID: 'Screen-1', name: 'Parents',
      component: ParentsScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-24', name: 'family-restroom', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-2', name: 'Mealtime',
      component: MealtimeScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-28', name: 'restaurant', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-3', name: 'AI Chat',
      component: ChatScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-25', name: 'chat', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-4', name: 'Learn',
      component: UnderstandingScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-26', name: 'school', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-5', name: 'Community',
      component: CommunityScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-29', name: 'groups', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-6', name: 'Get Help',
      component: GetHelpScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-27', name: 'help', size: 20, color: props.color }); } }
    })
  );
};
// @end:ParentTabNavigator

// @section:KidTabNavigator @depends:[TeensScreen,FeelingsScreen,BreathingScreen,StoriesScreen,GetHelpScreen,navigation-setup]
const KidTabNavigator = function() {
  var insets = useSafeAreaInsets();
  var themeContext = useTheme();
  var theme = themeContext.theme;
  return React.createElement(Tab.Navigator, { testID: 'Navigator-2', initialRouteName: 'Teens',
    screenOptions: {
      headerShown: false,
      tabBarStyle: { 
        position: 'absolute', 
        bottom: 0, 
        height: TAB_MENU_HEIGHT + insets.bottom, 
        borderTopWidth: 0, 
        backgroundColor: theme.colors.card 
      },
      tabBarItemStyle: { padding: 0 },
      tabBarActiveTintColor: theme.colors.accent,
      tabBarInactiveTintColor: theme.colors.textSecondary,
      tabBarLabelStyle: { fontSize: 10 }
    }
  },
React.createElement(Tab.Screen, { testID: 'Screen-5', name: 'Teens',
      component: TeensScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-28', name: 'sentiment-very-satisfied', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-6', name: 'Feelings',
      component: FeelingsScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-29', name: 'mood', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-7', name: 'Coping',
      component: CopingScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-30', name: 'self-improvement', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-8', name: 'Journal',
      component: JournalScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-31', name: 'book', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-9', name: 'Stories',
      component: StoriesScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-32', name: 'star', size: 20, color: props.color }); } }
    }),
    React.createElement(Tab.Screen, { testID: 'Screen-10', name: 'Get Help',
      component: GetHelpScreen,
      options: { tabBarIcon: function(props) { return React.createElement(MaterialIcons, { testID: 'MaterialIcons-33', name: 'help', size: 20, color: props.color }); } }
    })
  );
};
// @end:KidTabNavigator

// @section:AppNavigator @depends:[]
const AppNavigator = function() {
  const userRoleContext = useUserRole();
  const userRole = userRoleContext ? userRoleContext.userRole : null;
  const { user } = useAuth();

  if (!user) {
    return React.createElement(LoginScreen);
  }
  if (!userRole) {
    return React.createElement(WelcomeScreen);
  }
  if (userRole === 'parent') {
    return React.createElement(ParentTabNavigator);
  }
  return React.createElement(KidTabNavigator);
};
// @end:AppNavigator

// @section:styles @depends:[theme]
  const styles = StyleSheet.create({
    crisisBanner: {
      backgroundColor: '#DC2626',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      margin: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    crisisText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
      marginLeft: 8,
    },
    crisisCallButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    crisisButtonText: {
      color: '#DC2626',
      fontWeight: 'bold',
      fontSize: 14,
    },
    welcomeSection: {
      padding: 20,
      alignItems: 'center',
    },
    appTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 12,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    mainButtons: {
      paddingHorizontal: 20,
      gap: 16,
    },
    mainButton: {
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    mainButtonText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 8,
    },
    mainButtonSubtext: {
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.9,
      marginTop: 4,
    },
    quickLinks: {
      padding: 20,
      marginTop: 16,
    },
    quickLinksTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    quickLinksRow: {
      flexDirection: 'row',
      gap: 12,
    },
    quickLinkCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    quickLinkText: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 8,
      textAlign: 'center',
    },
    screenHeader: {
      padding: 20,
      paddingBottom: 16,
    },
    screenHeaderTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    clearChatButton: {
      padding: 8,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    screenSubtitle: {
      fontSize: 16,
      lineHeight: 22,
    },
    infoCard: {
      margin: 16,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 12,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginLeft: 12,
    },
    cardContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    bulletPoint: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 8,
      marginRight: 12,
    },
    bulletText: {
      fontSize: 16,
      lineHeight: 22,
      flex: 1,
    },
    aiChatButton: {
      margin: 16,
      padding: 20,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    aiChatButtonText: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: '600',
      marginHorizontal: 12,
    },
    reassuranceCard: {
      margin: 16,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    reassuranceTitle: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 8,
    },
    reassuranceText: {
      color: '#FFFFFF',
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
      opacity: 0.95,
    },
    faqItem: {
      marginBottom: 20,
    },
    faqQuestion: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    faqAnswer: {
      fontSize: 15,
      lineHeight: 20,
    },
    storyItem: {
      marginBottom: 20,
      padding: 16,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
      backgroundColor: backgroundColor,
      borderRadius: 8,
    },
    storyName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    storyText: {
      fontSize: 15,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    messageContainer: {
      marginVertical: 4,
    },
    userMessage: {
      alignItems: 'flex-end',
    },
    aiMessage: {
      alignItems: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    typingText: {
      fontSize: 14,
      fontStyle: 'italic',
      marginRight: 8,
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chatInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      position: 'absolute',
      bottom: 49,
      left: 0,
      right: 0,
      zIndex: 100,
    },
    chatInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      maxHeight: 100,
      marginRight: 12,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    disorderCard: {
      margin: 16,
      padding: 20,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    disorderHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    disorderName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 12,
    },
    disorderDescription: {
      fontSize: 16,
      lineHeight: 22,
      marginBottom: 16,
    },
    symptomsTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    symptomsList: {
      gap: 8,
    },
    importantNote: {
      margin: 16,
      padding: 20,
      borderRadius: 12,
      borderWidth: 2,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    importantText: {
      fontSize: 15,
      lineHeight: 20,
      marginLeft: 12,
      flex: 1,
    },
    emergencyCard: {
      margin: 16,
      padding: 24,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    emergencyTitle: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 12,
      textAlign: 'center',
    },
    emergencyNumber: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: 'bold',
      marginVertical: 8,
    },
    emergencySubtext: {
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.9,
      textAlign: 'center',
      marginBottom: 16,
    },
    callButton: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 24,
    },
    callButtonText: {
      color: accentColor,
      fontSize: 18,
      fontWeight: 'bold',
    },
    resourceItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    resourceInfo: {
      flex: 1,
    },
    resourceTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    resourceDescription: {
      fontSize: 14,
      lineHeight: 18,
    },
    resourceAction: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resourceActionText: {
      fontSize: 14,
      fontWeight: '500',
      marginRight: 4,
    },
    supportCard: {
      margin: 16,
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    supportTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 12,
      marginBottom: 8,
      textAlign: 'center',
    },
    supportText: {
      fontSize: 15,
      lineHeight: 20,
      textAlign: 'center',
    },
  });
  // @end:styles

  // @section:return @depends:[ThemeProvider,TabNavigator]
  return React.createElement(ThemeProvider, { testID: 'ThemeProvider-1' },
    React.createElement(AuthProvider, { testID: 'AuthProvider-1' },
      React.createElement(UserRoleProvider, { testID: 'UserRoleProvider-1' },
        React.createElement(View, { testID: 'View-50', style: { flex: 1, width: '100%', height: '100%' } },
          React.createElement(StatusBar, { testID: 'StatusBar-1', barStyle: 'dark-content' }),
          React.createElement(AppNavigator)
        )
      )
    )
  );
  // @end:return
};
return ComponentFunction;
