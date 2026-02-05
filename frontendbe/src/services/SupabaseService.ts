import { supabase } from './supabase';

export const SupabaseService = {
    // --- USER PROFILE ---
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    async updateProfile(userId: string, updates: any) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);
        if (error) throw error;
    },

    // --- USER SETTINGS ---
    async getUserSettings(userId: string) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error) throw error;
        return data;
    },

    async updateUserSettings(userId: string, updates: any) {
        const { error } = await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_id', userId);
        if (error) throw error;
    },

    // --- SCANS ---
    async saveScan(scanData: { user_id: string; input_type: string; intent: string; image_url?: string; website_url?: string }) {
        const { data, error } = await supabase
            .from('scans')
            .insert(scanData)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async saveScanResults(resultData: any) {
        const { error } = await supabase
            .from('scan_results')
            .insert(resultData);
        if (error) throw error;
    },

    async savePriceResults(resultData: any) {
        const { error } = await supabase
            .from('price_results')
            .insert(resultData);
        if (error) throw error;
    },

    async getUserHistory(userId: string) {
        // Fetch scans with their results
        const { data, error } = await supabase
            .from('scans')
            .select(`
                *,
                scan_results (*),
                price_results (*)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    // --- SUPPORT ---
    async createSupportTicket(ticket: { user_id: string; subject: string; message: string }) {
        const { error } = await supabase
            .from('support_tickets')
            .insert(ticket);
        if (error) throw error;
    },

    // --- STORAGE ---
    async uploadImage(uri: string, bucket: string = 'scans') {
        try {
            const ext = uri.substring(uri.lastIndexOf('.') + 1);
            const fileName = `${Date.now()}.${ext}`;
            const formData = new FormData();

            // React Native specific FormData handling
            formData.append('file', {
                uri,
                name: fileName,
                type: `image/${ext}`,
            } as any);

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, formData);

            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return publicUrlData.publicUrl;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    },
    // --- SECURITY & ACCOUNT ---
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    },

    async deleteUserAccount(userId: string) {
        // Delete all data. Due to cascade on profile, deleting profile should be enough.
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
        if (error) throw error;

        // Note: We cannot delete the Auth User from client side without Edge Function.
        // We will just sign out after data wipe.
        await supabase.auth.signOut();
    },

    async getFullUserData(userId: string) {
        // Parallel fetching for export
        const [profile, settings, scans, tickets] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', userId).single(),
            supabase.from('user_settings').select('*').eq('user_id', userId).single(),
            supabase.from('scans').select('*, scan_results(*), price_results(*)').eq('user_id', userId),
            supabase.from('support_tickets').select('*').eq('user_id', userId)
        ]);

        return {
            profile: profile.data,
            settings: settings.data,
            scans: scans.data,
            support_tickets: tickets.data,
            exported_at: new Date().toISOString()
        };
    }
};
