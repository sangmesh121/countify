import React, { useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Container } from '../../../components/Container';
import { SettingsItem } from '../../../components/settings/SettingsItem';
import { SettingsSection } from '../../../components/settings/SettingsSection';
import { spacing } from '../../../theme/colors';

export const ScanSettingsScreen = () => {
    const [defaultIntent, setDefaultIntent] = useState('Verify');
    const [autoSave, setAutoSave] = useState(true);
    const [highQuality, setHighQuality] = useState(false);
    const [hapticFeedback, setHapticFeedback] = useState(true);

    return (
        <Container>
            <ScrollView contentContainerStyle={styles.content}>

                <SettingsSection title="Default Scan Mode">
                    <SettingsItem
                        icon="check-circle"
                        title="Verification"
                        type="toggle" // Using toggle as radio mock for simplicity, ideally custom radio
                        value={defaultIntent === 'Verify'}
                        onToggle={() => setDefaultIntent('Verify')}
                    />
                    <SettingsItem
                        icon="tag"
                        title="Price Check"
                        type="toggle"
                        value={defaultIntent === 'Price'}
                        onToggle={() => setDefaultIntent('Price')}
                    />
                    <SettingsItem
                        icon="info-circle"
                        title="Product Details"
                        type="toggle"
                        value={defaultIntent === 'Details'}
                        onToggle={() => setDefaultIntent('Details')}
                        showBorder={false}
                    />
                </SettingsSection>

                <SettingsSection title="Camera & Capture">
                    <SettingsItem
                        icon="camera"
                        title="High Quality Images"
                        type="toggle"
                        value={highQuality}
                        onToggle={setHighQuality}
                    />
                    <SettingsItem
                        icon="vibrate"
                        title="Haptic Feedback"
                        type="toggle"
                        value={hapticFeedback}
                        onToggle={setHapticFeedback}
                        showBorder={false}
                    />
                </SettingsSection>

                <SettingsSection title="History">
                    <SettingsItem
                        icon="save"
                        title="Auto-Save Scans"
                        type="toggle"
                        value={autoSave}
                        onToggle={setAutoSave}
                        showBorder={false}
                    />
                </SettingsSection>

            </ScrollView>
        </Container>
    );
};

const styles = StyleSheet.create({
    content: {
        paddingTop: spacing.m,
        paddingBottom: spacing.xl,
    },
});
