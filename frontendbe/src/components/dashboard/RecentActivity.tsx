import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';

const MOCK_ACTIVITY = [
    { id: '1', name: 'Nike Air Jordan', status: 'Verified', date: '2 mins ago', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' },
    { id: '2', name: 'Rolex Submariner', status: 'Unknown', date: '5 hours ago', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314' },
    { id: '3', name: 'Gucci Bag', status: 'Fake', date: '1 day ago', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a' },
];

export const RecentActivity = () => {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<any>();

    const renderItem = ({ item }: { item: typeof MOCK_ACTIVITY[0] }) => (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: colors.surface,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: colors.border
                }
            ]}
            onPress={() => navigation.navigate('ScanTab', {
                screen: 'ScanResult',
                params: {
                    method: 'history',
                    intent: item.status === 'Verified' ? 'verify' : 'details'
                }
            })}
        >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
                <View style={[
                    styles.badge,
                    { backgroundColor: item.status === 'Verified' ? '#4CAF50' : item.status === 'Fake' ? '#F44336' : '#FFC107' }
                ]}>
                    <Text style={styles.badgeText}>{item.status}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Recent Activity</Text>
                <TouchableOpacity>
                    <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={MOCK_ACTIVITY}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.list}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    viewAll: {
        fontWeight: '600',
    },
    list: {
        paddingRight: spacing.m, // Add padding at end of scroll
    },
    card: {
        width: 160,
        marginRight: spacing.m,
        borderRadius: 12,
        overflow: 'hidden',
        // Shadow
        shadowColor: '#000',
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        paddingBottom: spacing.s,
    },
    image: {
        width: '100%',
        height: 100,
        backgroundColor: '#eee',
    },
    info: {
        padding: spacing.s,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    date: {
        fontSize: 12,
        marginBottom: 6,
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
