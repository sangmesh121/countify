import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Image } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';

interface PriceOption {
    seller: string;
    price: string;
    shipping: string;
    rating: number;
    link: string;
    logo?: string;
    best?: boolean;
}

interface PricingResultProps {
    bestPrice: string;
    averagePrice: string;
    options: PriceOption[];
}

export const PricingResult: React.FC<PricingResultProps> = ({ bestPrice, averagePrice, options }) => {
    const { colors, isDark } = useTheme();

    const renderItem = ({ item }: { item: PriceOption }) => (
        <View style={[
            styles.optionCard,
            {
                backgroundColor: colors.surface,
                borderColor: item.best ? '#4CAF50' : colors.border,
                borderWidth: item.best ? 2 : 1
            }
        ]}>
            <View style={styles.sellerInfo}>
                <View style={styles.logoPlaceholder}>
                    <FontAwesome5 name="store" size={16} color={colors.textSecondary} />
                </View>
                <View>
                    <Text style={[styles.sellerName, { color: colors.text }]}>{item.seller}</Text>
                    <View style={styles.ratingRow}>
                        <FontAwesome5 name="star" size={10} color="#FFC107" solid />
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}> {item.rating}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.priceInfo}>
                <Text style={[styles.price, { color: colors.primary }]}>{item.price}</Text>
                <Text style={[styles.shipping, { color: colors.textSecondary }]}>{item.shipping}</Text>
            </View>
            {item.best && (
                <View style={styles.bestBadge}>
                    <Text style={styles.bestText}>Best Deal</Text>
                </View>
            )}
            <TouchableOpacity style={[styles.buyBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(item.link)}>
                <Text style={styles.buyText}>Buy</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Insights */}
            <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
                <View style={styles.insightCol}>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Best Price</Text>
                    <Text style={[styles.insightValue, { color: '#4CAF50' }]}>{bestPrice}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.insightCol}>
                    <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Market Avg</Text>
                    <Text style={[styles.insightValue, { color: colors.text }]}>{averagePrice}</Text>
                </View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Sellers</Text>
            <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false} // Since parent is ScrollView
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.l,
    },
    insightCard: {
        flexDirection: 'row',
        padding: spacing.m,
        borderRadius: 12,
        marginBottom: spacing.l,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    insightCol: {
        alignItems: 'center',
    },
    insightLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    insightValue: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        height: 40,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: spacing.m,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderRadius: 12,
        marginBottom: spacing.m,
        position: 'relative',
    },
    sellerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 2,
    },
    logoPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.s,
    },
    sellerName: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 10,
    },
    priceInfo: {
        flex: 1,
        alignItems: 'flex-end',
        marginRight: spacing.m,
    },
    price: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    shipping: {
        fontSize: 10,
    },
    buyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    buyText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    bestBadge: {
        position: 'absolute',
        top: -10,
        left: 10,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bestText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
});
