import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { AuthService } from "./auth";
import { requireAuth, requireAdmin, requireUser, type AuthenticatedRequest } from "./middleware/auth";
import { FileService } from "./services/fileService";
import { ScriptService } from "./services/scriptService";
import { 
  loginSchema, 
  registerDeviceSchema, 
  insertAdminSchema,
  insertUserSchema,
  insertCountrySchema,
  downloadScriptSchema,
  reportStatusSchema
} from "@shared/schema";
import "./types";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/admin-login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.loginAdmin(email, password);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      req.session.isAdmin = true;
      req.session.adminEmail = email;
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, macAddress } = registerDeviceSchema.parse(req.body);
      const result = await AuthService.loginUser(email, password, macAddress);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      req.session.userId = result.user.id;
      req.session.userEmail = result.user.email;
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/register-device', async (req, res) => {
    try {
      const { email, password, macAddress } = registerDeviceSchema.parse(req.body);
      const result = await AuthService.registerDevice(email, password, macAddress);
      
      if (!result) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Set session
      req.session.userId = result.user.id;
      req.session.userEmail = result.user.email;
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User management routes
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await AuthService.hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.password) {
        updates.password = await AuthService.hashPassword(updates.password);
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Country management routes
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await storage.getAllCountries();
      res.json(countries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/countries', requireAuth, requireAdmin, async (req, res) => {
    try {
      const countryData = insertCountrySchema.parse(req.body);
      const country = await storage.createCountry(countryData);
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put('/api/admin/countries/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const country = await storage.updateCountry(id, updates);
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/countries/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCountry(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Country not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Script management routes
  app.get('/api/scripts', async (req, res) => {
    try {
      const scripts = await storage.getAllScripts();
      res.json(scripts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/admin/scripts', requireAuth, requireAdmin, upload.single('file'), async (req, res) => {
    try {
      const { appName } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      if (!file.originalname.endsWith('.py')) {
        return res.status(400).json({ message: 'Only Python files are allowed' });
      }
      
      const { filePath, fileName, fileSize } = await FileService.saveScript(file.buffer, file.originalname);
      
      const script = await storage.createScript({
        appName,
        fileName,
        filePath,
        fileSize
      });
      
      res.json(script);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/admin/scripts/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const script = await storage.getScript(id);
      
      if (!script) {
        return res.status(404).json({ message: 'Script not found' });
      }
      
      await FileService.deleteScript(script.filePath);
      const deleted = await storage.deleteScript(id);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Script download route for desktop clients
  app.post('/api/scripts/download', requireAuth, requireUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { scriptId, countryId, phoneNumbers } = downloadScriptSchema.parse(req.body);
      
      const { content, tempPath } = await ScriptService.prepareScriptForDownload(
        scriptId, 
        countryId, 
        phoneNumbers
      );
      
      // Create task record
      const task = await storage.createTask({
        userId: req.user!.id,
        scriptId,
        countryId,
        status: 'running',
        otpProcessed: 0
      });
      
      res.json({
        script: content,
        taskId: task.id
      });
      
      // Clean up temp file after a delay
      setTimeout(async () => {
        await FileService.deleteTempFile(tempPath);
      }, 60000); // 1 minute
      
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Task reporting route
  app.post('/api/tasks/report-status', requireAuth, requireUser, async (req: AuthenticatedRequest, res) => {
    try {
      const { taskId, status, otpProcessed, errorMessage } = reportStatusSchema.parse(req.body);
      
      const task = await storage.updateTask(taskId, {
        status,
        otpProcessed,
        errorMessage
      });
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Task management routes
  app.get('/api/admin/tasks', requireAuth, requireAdmin, async (req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      
      // Enrich tasks with user, script, and country information
      const enrichedTasks = await Promise.all(tasks.map(async (task) => {
        const user = await storage.getUser(task.userId);
        const script = await storage.getScript(task.scriptId);
        const country = await storage.getCountry(task.countryId);
        
        return {
          ...task,
          userEmail: user?.email || 'Unknown',
          scriptName: script?.appName || 'Unknown',
          countryName: country?.name || 'Unknown'
        };
      }));
      
      res.json(enrichedTasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
