import bcrypt from 'bcrypt';
import { storage } from './storage';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async loginAdmin(email: string, password: string): Promise<{ admin: any } | null> {
    // Check database for admin credentials
    const admin = await storage.getAdminByEmail(email);
    if (!admin) return null;

    const isValid = await this.comparePassword(password, admin.password);
    if (!isValid) return null;

    return { admin: { id: admin.id, email: admin.email } };
  }

  static async loginUser(email: string, password: string, macAddress: string): Promise<{ user: any } | null> {
    console.log(`[DEBUG] LoginUser called for ${email} with MAC: ${macAddress}`);
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      console.log(`[DEBUG] User not found: ${email}`);
      return null;
    }

    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) {
      console.log(`[DEBUG] Invalid password for user: ${email}`);
      return null;
    }

    console.log(`[DEBUG] User ${email} current MAC: ${user.macAddress}`);
    
    // If no MAC address is bound, bind this one (first-time login)
    if (!user.macAddress) {
      console.log(`[DEBUG] Binding MAC address ${macAddress} to user ${email}`);
      await storage.updateUserMacAddress(user.id, macAddress);
      console.log(`[DEBUG] MAC address bound successfully`);
      return { user: { id: user.id, email: user.email, macAddress } };
    }

    // Check MAC address binding for subsequent logins
    if (user.macAddress !== macAddress) {
      console.log(`[DEBUG] MAC mismatch for ${email}. Expected: ${user.macAddress}, Got: ${macAddress}`);
      throw new Error('Device not authorized for this account');
    }

    console.log(`[DEBUG] MAC address verified for user ${email}`);
    return { user: { id: user.id, email: user.email, macAddress: user.macAddress } };
  }

  static async registerDevice(email: string, password: string, macAddress: string): Promise<{ user: any } | null> {
    const user = await storage.getUserByEmail(email);
    if (!user) return null;

    const isValid = await this.comparePassword(password, user.password);
    if (!isValid) return null;

    // If no MAC address is bound, bind this one
    if (!user.macAddress) {
      await storage.updateUserMacAddress(user.id, macAddress);
      return { user: { id: user.id, email: user.email, macAddress } };
    }

    // If MAC address already bound, check if it matches
    if (user.macAddress !== macAddress) {
      throw new Error('Device already registered to a different MAC address');
    }

    return { user: { id: user.id, email: user.email, macAddress: user.macAddress } };
  }
}
