import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Container } from '../../components/Container';
import { useAuth } from '../../helpers/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';

// Components
import { ActionCard } from '../../components/dashboard/ActionCard';
import { QuickStats } from '../../components/dashboard/QuickStats';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { UpgradeBanner } from '../../components/dashboard/UpgradeBanner';
import { FontAwesome5 } from '@expo/vector-icons';

export const DashboardScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const { colors, themeMode } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    // Mock data for QuickStats
    const statsData = [
        { label: 'Total Scans', value: '124', accentColor: colors.primary },
        { label: 'Verified', value: '98', accentColor: '#4CAF50' },
        { label: 'Issues', value: '3', accentColor: '#F44336' },
    ];

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Simulate network request
        setTimeout(() => setRefreshing(false), 1500);
    }, []);

    const handleUpgrade = () => {
        // Navigate to subscription screen or show modal
        alert('Upgrade flow not implemented yet!');
    };

    return (
        <Container>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.text }]}>
                            Hello, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Welcome back
                        </Text>
                    </View>
                    <View style={[styles.avatar, { backgroundColor: colors.border }]}>
                        <FontAwesome5 name="user" size={20} color={colors.textSecondary} />
                    </View>
                </View>

                {/* Upgrade Banner (Conditional - always show for now as demo) */}
                <UpgradeBanner onPress={handleUpgrade} />

                {/* Quick Stats */}
                <QuickStats stats={statsData} />

                {/* Primary Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Actions</Text>
                    <ActionCard
                        title="Scan Product"
                        subtitle="Verify authenticity instantly"
                        icon="camera"
                        color={colors.primary}
                        onPress={() => navigation.navigate('ScanTab')}
                    />
                    <ActionCard
                        title="Upload Image"
                        subtitle="Check from your gallery"
                        icon="image"
                        color={colors.secondary}
                        onPress={() => navigation.navigate('ScanTab', { screen: 'ScanScreen', params: { mode: 'upload' } })}
                    />
                    <ActionCard
                        title="Check Website"
                        subtitle="Verify URL safety"
                        icon="globe"
                        color="#FF9800"
                        onPress={() => navigation.navigate('ScanTab', { screen: 'ScanScreen', params: { mode: 'url' } })}
                    />
                </View>

                {/* Recent Activity */}
                <RecentActivity />

            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
        marginTop: spacing.s,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginBottom: spacing.l,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: spacing.m,
    },
});
