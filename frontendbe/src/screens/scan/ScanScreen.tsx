import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, Alert, TextInput, TouchableOpacity } from 'react-native';
import { Container } from '../../components/Container';
import { Button } from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../theme/colors';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';

// Components
import { MethodSelector, ScanMethod } from '../../components/scan/MethodSelector';
import { IntentSelector, ScanIntent } from '../../components/scan/IntentSelector';
import { useAuth } from '../../helpers/AuthContext';
import { SupabaseService } from '../../services/SupabaseService';
import { VerificationService } from '../../services/VerificationService';

export const ScanScreen = ({ navigation, route }: any) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    // Params from Dashboard (e.g. mode='upload')
    const initialMode = route.params?.mode || 'camera';

    const [method, setMethod] = useState<ScanMethod>(initialMode);
    const [intent, setIntent] = useState<ScanIntent>('verify');

    // Inputs
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [url, setUrl] = useState('');

    // Camera
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        if (route.params?.mode) {
            setMethod(route.params.mode);
        }
    }, [route.params?.mode]);

    useEffect(() => {
        if (method === 'camera' && !permission?.granted) {
            requestPermission();
        }
    }, [method]);

    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleCameraCapture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                if (photo) {
                    setImageUri(photo.uri);
                    setScanned(true); // Stop preview
                }
            } catch (e) {
                console.error(e);
                Alert.alert('Error', 'Failed to take photo');
            }
        }
    };

    const handleClear = () => {
        setImageUri(null);
        setScanned(false);
        setUrl('');
    };

    const handleSubmit = async () => {
        if (method === 'camera' || method === 'upload') {
            if (!imageUri) {
                Alert.alert('Input Required', 'Please provide an image.');
                return;
            }
        } else if (method === 'url') {
            if (!url) {
                Alert.alert('Input Required', 'Please enter a URL.');
                return;
            }
        }

        if (!user) {
            Alert.alert('Auth Error', 'You must be logged in to scan.');
            return;
        }

        setIsProcessing(true);
        try {
            let apiResult = null;
            let finalImageUrl = imageUri;

            // 1. Upload & Verify
            if (method !== 'url' && imageUri) {
                // Determine if we need to upload to Supabase first OR just send to backend. 
                // The task is "search by uploading", usually implies sending the image to the search engine.
                // Our VerificationService takes the local URI and uploads it to the backend.
                // We might still want to upload to Supabase for history persistence, but the backend verification is priority.

                try {
                    // Call our new Python Backend API based on intent
                    if (intent === 'price') {
                        console.log("Checking Price...");
                        apiResult = await VerificationService.checkPrice(imageUri);
                    } else if (intent === 'details') {
                        console.log("Getting Details...");
                        apiResult = await VerificationService.getProductDetails(imageUri);
                    } else {
                        // Default: verify
                        console.log("Verifying...");
                        apiResult = await VerificationService.verifyProduct(imageUri);
                    }

                    console.log("API Result:", apiResult);
                } catch (err) {
                    console.error("Backend Request Failed:", err);
                    Alert.alert("Request Failed", "Could not process image with backend.");
                    setIsProcessing(false);
                    return;
                }

                // Optional: Upload to Supabase for persistence if needed
                try {
                    finalImageUrl = await SupabaseService.uploadImage(imageUri, 'scans');
                } catch (err) {
                    console.warn("Supabase upload failed, falling back to local URI", err);
                }
            }

            // 2. Save Scan Record (History) - NON-BLOCKING
            let scanData = { id: 'temp-id-' + Date.now() }; // Fallback ID
            try {
                scanData = await SupabaseService.saveScan({
                    user_id: user?.id || 'anon',
                    input_type: method,
                    intent: intent,
                    image_url: finalImageUrl || undefined,
                    website_url: method === 'url' ? url : undefined
                });
            } catch (err) {
                console.warn("Supabase History Save Failed (Non-critical):", err);
            }

            // 3. Save Results - NON-BLOCKING
            try {
                const resultForDb = {
                    scan_id: scanData.id,
                    authenticity_status: intent === 'verify' ? 'analyzed' : 'info_only',
                    confidence_score: 0,
                    product_name: apiResult?.product_name || 'Analysis Complete',
                    metadata: apiResult
                };
                await SupabaseService.saveScanResults(resultForDb);
            } catch (err) {
                console.warn("Supabase Result Save Failed (Non-critical):", err);
            }

            console.log("Navigating to ScanResult...", { apiResult, intent });

            // 4. Navigate with Real Data
            navigation.navigate('ScanResult', {
                method,
                intent,
                data: finalImageUrl || url,
                scanId: scanData.id,
                mockResult: null, // Clear mock
                apiResult: apiResult // Pass real result
            });

        } catch (error: any) {
            Alert.alert('Scan Failed', error.message || 'Could not save scan.');
        } finally {
            setIsProcessing(false);
        }
    };

    // Render Camera Input
    const renderCameraInput = () => {
        if (Platform.OS === 'web') {
            return (
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text }}>Camera not fully supported on Web. Please use Upload.</Text>
                    <Button title="Switch to Upload" onPress={() => setMethod('upload')} style={{ marginTop: 10 }} />
                </View>
            );
        }

        if (!permission?.granted) {
            return (
                <View style={styles.inputContainer}>
                    <Text style={{ textAlign: 'center', marginBottom: 10, color: colors.text }}>We need your permission to show the camera</Text>
                    <Button onPress={requestPermission} title="Grant Permission" />
                </View>
            );
        }

        if (imageUri && scanned) {
            return (
                <View style={[styles.inputContainer, { padding: 0, overflow: 'hidden' }]}>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: 300 }} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={handleClear}>
                        <FontAwesome5 name="times" size={16} color="#fff" />
                        <Text style={{ color: '#fff', marginLeft: 8 }}>Retake</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={[styles.inputContainer, { padding: 0, overflow: 'hidden', height: 300, backgroundColor: '#000' }]}>
                <CameraView style={{ flex: 1 }} ref={cameraRef}>
                    <View style={styles.cameraOverlay}>
                        {/* Scan Frame */}
                        <View style={styles.scanFrame} />
                        {/* Capture Button */}
                        <TouchableOpacity style={styles.captureBtn} onPress={handleCameraCapture}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </CameraView>
            </View>
        );
    };

    // Render Upload Input
    const renderUploadInput = () => (
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {imageUri ? (
                <View>
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="cover" />
                    <Button title="Remove Image" variant="outline" onPress={handleClear} style={{ marginTop: 10 }} />
                </View>
            ) : (
                <View style={{ alignItems: 'center', padding: 20 }}>
                    <FontAwesome5 name="cloud-upload-alt" size={40} color={colors.primary} style={{ marginBottom: 10 }} />
                    <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>Select an image from gallery</Text>
                    <Button title="Select Image" onPress={handlePickImage} />
                </View>
            )}
        </View>
    );

    // Render URL Input
    const renderUrlInput = () => (
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.text }]}>Submit Product Link</Text>
            <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#333' : '#fff' }]}
                placeholder="https://example.com/product/..."
                placeholderTextColor={colors.textSecondary}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                keyboardType="url"
            />
            <Button title="Paste" variant="outline" onPress={() => Alert.alert('Paste', 'Paste logic here')} style={{ alignSelf: 'flex-start' }} />
        </View>
    );

    const getButtonTitle = () => {
        switch (intent) {
            case 'verify': return 'Verify Authenticity';
            case 'price': return 'Check Pricing';
            case 'details': return 'Get Product Details';
            default: return 'Submit';
        }
    };

    return (
        <Container>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <MethodSelector selectedMethod={method} onSelect={(m) => { handleClear(); setMethod(m); }} />

                {/* Dynamic Input Area */}
                <View style={styles.section}>
                    {method === 'camera' && renderCameraInput()}
                    {method === 'upload' && renderUploadInput()}
                    {method === 'url' && renderUrlInput()}
                </View>

                {/* Intent Selection */}
                <IntentSelector selectedIntent={intent} onSelect={setIntent} />

                {/* Submit */}
                <Button
                    title={isProcessing ? "Processing..." : getButtonTitle()}
                    onPress={handleSubmit}
                    style={{ marginTop: spacing.m }}
                    disabled={isProcessing || (!imageUri && method !== 'url') || (method === 'url' && !url)}
                    loading={isProcessing}
                />
            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xl,
        paddingTop: spacing.m,
    },
    section: {
        marginBottom: spacing.l,
    },
    inputContainer: {
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        minHeight: 150,
        justifyContent: 'center',
        padding: spacing.m,
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: spacing.m,
        marginBottom: 10,
    },
    // Camera Styles
    cameraOverlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    scanFrame: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        right: '10%',
        height: 250,
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 12,
    },
    captureBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
    },
    retakeBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
});
