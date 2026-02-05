import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Container } from '../../components/Container';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';

// Result Components
import { ProductSummaryCard } from '../../components/results/ProductSummaryCard';
import { VerificationResult } from '../../components/results/VerificationResult';
import { PricingResult } from '../../components/results/PricingResult';
import { DetailsResult } from '../../components/results/DetailsResult';

export const ScanResultScreen = ({ route, navigation }: any) => {
    const { colors } = useTheme();
    const { method, intent, data, apiResult, mockResult } = route.params || {};

    // Helper to map API result to UI
    const mapApiToUi = () => {
        if (apiResult && Object.keys(apiResult).length > 0) {
            console.log("Mapping API Result (ScanResultScreen):", apiResult);
            // Real Backend Data
            const analysis = apiResult.input_analysis || {};
            const verification = apiResult.verification_result || {};
            const search = apiResult.reference_search || {};

            return {
                productInfo: {
                    name: analysis.product_name || 'Analyzed Product',
                    brand: analysis.brand || 'Detected Brand',
                    sku: analysis.sku || 'N/A',
                    confidence: verification.similarity_score ? Math.round(verification.similarity_score * 100) : 0,
                    image: data || 'https://via.placeholder.com/300'
                },
                verificationData: {
                    status: (verification.is_authentic ? 'genuine' : 'fake') as 'genuine' | 'fake' | 'suspicious',
                    checks: [
                        { name: 'Visual Match', status: (verification.similarity_score > 0.8 ? 'pass' : 'warn') as 'pass' | 'warn' | 'fail', score: Math.round((verification.similarity_score || 0) * 100) },
                        { name: 'Feature Analysis', status: 'pass' as 'pass' | 'warn' | 'fail', score: 95 }, // Placeholder based on Gemini
                        { name: 'Reference Check', status: (search.found_url ? 'pass' : 'fail') as 'pass' | 'warn' | 'fail', score: search.found_url ? 100 : 0 }
                    ]
                }
            };
        } else if (mockResult) {
            // Logic for existing mockResult if any (legacy from ScanScreen fallback)
            return {
                productInfo: {
                    name: mockResult.product_name || 'Simulated Product',
                    brand: mockResult.brand || 'Nike',
                    sku: 'MOCK-123',
                    confidence: Math.round((mockResult.confidence_score || 0.9) * 100),
                    image: data || 'https://images.unsplash.com/photo-1552346154-21d32810aba3'
                },
                verificationData: {
                    status: (mockResult.authenticity_status === 'Genuine' ? 'genuine' : 'fake') as 'genuine' | 'fake' | 'suspicious',
                    checks: [
                        { name: 'Swoosh Logo Geometry', status: 'pass' as 'pass' | 'warn' | 'fail', score: 99 },
                        { name: 'Stitching Consistency', status: 'pass' as 'pass' | 'warn' | 'fail', score: 97 }
                    ]
                }
            };
        } else {
            // Fallback default
            return {
                productInfo: {
                    name: 'Unknown Product',
                    brand: 'Unknown',
                    sku: '---',
                    confidence: 0,
                    image: data
                },
                verificationData: {
                    status: 'warn' as 'genuine' | 'fake' | 'suspicious',
                    checks: []
                }
            };
        }
    };

    const { productInfo, verificationData } = mapApiToUi();

    // Map Price Data
    const mapPriceData = () => {
        if (intent === 'price' && apiResult?.prices) {
            const prices = apiResult.prices || [];
            if (prices.length === 0) return { bestPrice: 'N/A', averagePrice: 'N/A', options: [] };

            const best = prices.reduce((min: any, p: any) => p.price < min.price ? p : min, prices[0]);
            const avg = prices.reduce((sum: number, p: any) => sum + p.price, 0) / prices.length;

            return {
                bestPrice: `${best.currency} ${best.price.toFixed(2)}`,
                averagePrice: `${best.currency} ${avg.toFixed(2)}`,
                options: prices.map((p: any) => ({
                    seller: p.seller,
                    price: `${p.currency} ${p.price.toFixed(2)}`,
                    shipping: 'Check Link', // API doesn't return shipping yet
                    rating: p.rating,
                    link: p.link,
                    best: p === best
                }))
            };
        }
        // Fallback Mock
        return {
            bestPrice: '$170.00',
            averagePrice: '$185.00',
            options: [
                { seller: 'StockX', price: '$170.00', shipping: '+$15 Shipping', rating: 4.8, link: 'https://stockx.com', best: true },
                { seller: 'GOAT', price: '$175.00', shipping: '+$12 Shipping', rating: 4.7, link: 'https://goat.com' },
                { seller: 'eBay', price: '$182.00', shipping: 'Free Shipping', rating: 4.5, link: 'https://ebay.com' },
            ]
        };
    };
    const pricingData = mapPriceData();

    // Map Details Data
    const mapDetailsData = () => {
        if (intent === 'details' && apiResult) {
            return {
                description: apiResult.description || 'No description available.',
                specs: apiResult.specs || [
                    { label: 'Brand', value: productInfo.brand },
                    { label: 'Name', value: productInfo.name }
                ]
            };
        }
        return {
            description: productInfo.name + " detected. Analysis complete.",
            specs: [
                { label: 'Brand', value: productInfo.brand },
                { label: 'Confidence', value: productInfo.confidence + '%' },
            ]
        };
    };
    const detailsData = mapDetailsData();

    const getIntentLabel = () => {
        switch (intent) {
            case 'verify': return 'Authenticity Check';
            case 'price': return 'Price Comparison';
            case 'details': return 'Product Details';
            default: return 'Scan Result';
        }
    };

    return (
        <Container>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Intent Badge */}
                <View style={[styles.badgeContainer, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{getIntentLabel()}</Text>
                </View>

                {/* Product Summary */}
                <ProductSummaryCard
                    image={productInfo.image}
                    name={productInfo.name}
                    brand={productInfo.brand}
                    sku={productInfo.sku}
                    confidence={productInfo.confidence}
                />

                {/* Dynamic Content Actions */}
                <View style={styles.content}>
                    {intent === 'verify' && (
                        <VerificationResult status={verificationData.status} checks={verificationData.checks} />
                    )}

                    {intent === 'price' && (
                        <PricingResult
                            bestPrice={pricingData.bestPrice}
                            averagePrice={pricingData.averagePrice}
                            options={pricingData.options}
                        />
                    )}

                    {intent === 'details' && (
                        <DetailsResult
                            description={detailsData.description}
                            specs={detailsData.specs}
                        />
                    )}
                </View>

                {/* Footer Actions */}
                <View style={styles.footer}>
                    <Button title="Save to History" variant="secondary" style={{ marginBottom: 10 }} />
                    <Button title="Scan Another" variant="outline" onPress={() => navigation.navigate('ScanScreen')} />
                </View>

            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xl,
        paddingTop: spacing.m,
    },
    badgeContainer: {
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: '#eee',
    },
    badgeText: {
        fontWeight: 'bold',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    content: {
        marginBottom: spacing.l,
    },
    footer: {
        marginTop: spacing.m,
    },
});
