import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';

interface StatItem {
    label: string;
    value: string;
    accentColor: string;
}

interface QuickStatsProps {
    stats: StatItem[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ stats }) => {
    const { colors, isDark } = useTheme();

    return (
        <View style={styles.container}>
            {stats.map((stat, index) => (
                <View
                    key={index}
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: isDark ? 1 : 0,
                        }
                    ]}
                >
                    <Text style={[styles.value, { color: stat.accentColor }]}>{stat.value}</Text>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>{stat.label}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    card: {
        flex: 1,
        padding: spacing.m,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        textAlign: 'center',
    },
});
