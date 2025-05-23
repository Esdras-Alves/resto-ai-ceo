
import { toast } from "sonner";

// Tipos para LGPD
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics' | 'cookies';
  granted: boolean;
  timestamp: string;
  ipAddress?: string;
  version: string;
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestDate: string;
  completionDate?: string;
  details?: string;
}

export interface PersonalDataInventory {
  dataType: string;
  purpose: string;
  legalBasis: string;
  retentionPeriod: string;
  categories: string[];
  thirdParties?: string[];
}

// Classe para conformidade com LGPD
export class LGPDService {
  private static instance: LGPDService;
  private consentRecords: ConsentRecord[] = [];
  private dataRequests: DataSubjectRequest[] = [];

  public static getInstance(): LGPDService {
    if (!LGPDService.instance) {
      LGPDService.instance = new LGPDService();
    }
    return LGPDService.instance;
  }

  // Inventário de dados pessoais
  private personalDataInventory: PersonalDataInventory[] = [
    {
      dataType: "Dados de Identificação",
      purpose: "Autenticação e identificação do usuário",
      legalBasis: "Execução de contrato",
      retentionPeriod: "5 anos após término do contrato",
      categories: ["nome", "email", "telefone"]
    },
    {
      dataType: "Dados Financeiros",
      purpose: "Gestão financeira do estabelecimento",
      legalBasis: "Execução de contrato e obrigação legal",
      retentionPeriod: "10 anos (obrigação fiscal)",
      categories: ["transações", "receitas", "despesas"]
    },
    {
      dataType: "Dados de Navegação",
      purpose: "Melhoria da experiência do usuário",
      legalBasis: "Consentimento",
      retentionPeriod: "2 anos",
      categories: ["cookies", "logs de acesso", "preferências"]
    },
    {
      dataType: "Dados de Marketing",
      purpose: "Comunicações promocionais e marketing",
      legalBasis: "Consentimento",
      retentionPeriod: "3 anos ou até revogação do consentimento",
      categories: ["preferências de comunicação", "histórico de campanhas"]
    }
  ];

  // Registrar consentimento
  async recordConsent(
    userId: string, 
    consentType: ConsentRecord['consentType'], 
    granted: boolean,
    version: string = "1.0"
  ): Promise<void> {
    const consent: ConsentRecord = {
      id: crypto.randomUUID(),
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP(),
      version
    };

    this.consentRecords.push(consent);
    
    try {
      // Store in localStorage for now instead of Supabase
      localStorage.setItem('consent_records', JSON.stringify(this.consentRecords));
      toast.success("Consentimento registrado com sucesso");
    } catch (error) {
      console.error("Erro ao registrar consentimento:", error);
      toast.error("Erro ao registrar consentimento");
    }
  }

  // Verificar consentimento
  hasConsent(userId: string, consentType: ConsentRecord['consentType']): boolean {
    const latestConsent = this.consentRecords
      .filter(c => c.userId === userId && c.consentType === consentType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    return latestConsent?.granted || false;
  }

  // Criar solicitação do titular de dados
  async createDataSubjectRequest(
    userId: string,
    requestType: DataSubjectRequest['requestType'],
    details?: string
  ): Promise<string> {
    const request: DataSubjectRequest = {
      id: crypto.randomUUID(),
      userId,
      requestType,
      status: 'pending',
      requestDate: new Date().toISOString(),
      details
    };

    this.dataRequests.push(request);

    try {
      // Store in localStorage for now instead of Supabase
      localStorage.setItem('data_subject_requests', JSON.stringify(this.dataRequests));
      toast.success("Solicitação registrada. Será processada em até 15 dias úteis.");
      return request.id;
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      toast.error("Erro ao registrar solicitação");
      throw error;
    }
  }

  // Exportar dados do usuário (direito de portabilidade)
  async exportUserData(userId: string): Promise<any> {
    try {
      // Buscar todos os dados do usuário
      const userData = {
        profile: this.getUserProfile(userId),
        financialData: this.getUserFinancialData(userId),
        inventoryData: this.getUserInventoryData(userId),
        consentHistory: this.getUserConsentHistory(userId),
        exportDate: new Date().toISOString(),
        format: "JSON"
      };

      // Registrar a exportação nos logs
      this.logDataExport(userId);

      return userData;
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      throw new Error("Falha na exportação de dados");
    }
  }

  // Anonimizar dados do usuário
  async anonymizeUserData(userId: string): Promise<void> {
    try {
      // Substituir dados identificáveis por valores anônimos
      const anonymizedData = {
        name: "Usuário Anônimo",
        email: `anonimo_${Date.now()}@exemplo.com`,
        anonymized_at: new Date().toISOString()
      };

      // Store in localStorage for now
      localStorage.setItem(`anonymized_${userId}`, JSON.stringify(anonymizedData));
      toast.success("Dados anonimizados com sucesso");
    } catch (error) {
      console.error("Erro ao anonimizar dados:", error);
      toast.error("Erro na anonimização");
    }
  }

  // Métodos auxiliares
  private getClientIP(): string {
    return '0.0.0.0'; // Simulado
  }

  private getUserProfile(userId: string): any {
    // Simulated data retrieval
    return { id: userId, name: "User Name", email: "user@example.com" };
  }

  private getUserFinancialData(userId: string): any {
    // Simulated data retrieval
    return { userId, transactions: [] };
  }

  private getUserInventoryData(userId: string): any {
    // Simulated data retrieval
    return { userId, inventory: [] };
  }

  private getUserConsentHistory(userId: string): ConsentRecord[] {
    return this.consentRecords.filter(c => c.userId === userId);
  }

  private logDataExport(userId: string): void {
    const log = {
      userId,
      action: 'export',
      timestamp: new Date().toISOString(),
      ipAddress: this.getClientIP()
    };
    
    const logs = JSON.parse(localStorage.getItem('data_access_logs') || '[]');
    logs.push(log);
    localStorage.setItem('data_access_logs', JSON.stringify(logs));
  }

  // Obter inventário de dados
  getPersonalDataInventory(): PersonalDataInventory[] {
    return [...this.personalDataInventory];
  }

  // Obter solicitações do usuário
  getUserRequests(userId: string): DataSubjectRequest[] {
    return this.dataRequests.filter(r => r.userId === userId);
  }
}

// Instância singleton
export const lgpdService = LGPDService.getInstance();
