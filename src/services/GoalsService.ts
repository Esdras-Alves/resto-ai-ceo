
import { toast } from "sonner";
import { addSystemAlert } from "./ModuleIntegrationService";

// Interfaces para o sistema de metas
export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  category: GoalCategory;
  deadline?: string;
  reward?: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type GoalCategory = 'financial' | 'inventory' | 'sales' | 'operational' | 'customer';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: GoalCategory;
  dateUnlocked: string | null;
  isUnlocked: boolean;
  requiredGoals?: number;
}

// Função para obter todas as metas
export function getAllGoals(): Goal[] {
  try {
    const goalsData = localStorage.getItem("goals");
    return goalsData ? JSON.parse(goalsData) : [];
  } catch (error) {
    console.error("Erro ao carregar metas:", error);
    return [];
  }
}

// Função para obter metas por categoria
export function getGoalsByCategory(category: GoalCategory): Goal[] {
  const goals = getAllGoals();
  return goals.filter(goal => goal.category === category);
}

// Função para adicionar uma nova meta
export function addGoal(goal: Omit<Goal, "id" | "createdAt" | "updatedAt" | "completed">): Goal {
  try {
    const goals = getAllGoals();
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    goals.push(newGoal);
    localStorage.setItem("goals", JSON.stringify(goals));
    
    toast.success("Nova meta adicionada", {
      description: newGoal.title
    });
    
    return newGoal;
  } catch (error) {
    console.error("Erro ao adicionar meta:", error);
    toast.error("Erro ao adicionar meta");
    throw error;
  }
}

// Função para atualizar o progresso de uma meta
export function updateGoalProgress(goalId: string, newValue: number): Goal | null {
  try {
    const goals = getAllGoals();
    const goalIndex = goals.findIndex(g => g.id === goalId);
    
    if (goalIndex === -1) {
      return null;
    }
    
    const updatedGoal = { ...goals[goalIndex] };
    updatedGoal.current = newValue;
    updatedGoal.updatedAt = new Date().toISOString();
    
    // Verificar se a meta foi concluída
    if (!updatedGoal.completed && updatedGoal.current >= updatedGoal.target) {
      updatedGoal.completed = true;
      
      // Notificar o usuário
      toast.success("🎉 Meta alcançada!", {
        description: updatedGoal.title
      });
      
      // Adicionar alerta ao sistema
      addSystemAlert({
        type: "success",
        title: "Meta Alcançada",
        description: `Parabéns! Você completou: ${updatedGoal.title}`,
        date: new Date().toLocaleString()
      });
      
      // Verificar se um achievement foi desbloqueado
      checkAchievements();
    }
    
    goals[goalIndex] = updatedGoal;
    localStorage.setItem("goals", JSON.stringify(goals));
    
    // Disparar evento para atualizar os componentes
    const event = new CustomEvent("goalsUpdated", { detail: updatedGoal });
    window.dispatchEvent(event);
    
    return updatedGoal;
  } catch (error) {
    console.error("Erro ao atualizar progresso da meta:", error);
    return null;
  }
}

// Remover uma meta
export function removeGoal(goalId: string): boolean {
  try {
    const goals = getAllGoals();
    const updatedGoals = goals.filter(g => g.id !== goalId);
    
    if (updatedGoals.length === goals.length) {
      return false;
    }
    
    localStorage.setItem("goals", JSON.stringify(updatedGoals));
    return true;
  } catch (error) {
    console.error("Erro ao remover meta:", error);
    return false;
  }
}

// Funções para conquistas
export function getAllAchievements(): Achievement[] {
  try {
    const achievementsData = localStorage.getItem("achievements");
    if (achievementsData) {
      return JSON.parse(achievementsData);
    } else {
      // Conquistas padrão se não existirem
      const defaultAchievements = getDefaultAchievements();
      localStorage.setItem("achievements", JSON.stringify(defaultAchievements));
      return defaultAchievements;
    }
  } catch (error) {
    console.error("Erro ao carregar conquistas:", error);
    return [];
  }
}

// Função para verificar e desbloquear conquistas
export function checkAchievements(): Achievement[] {
  const goals = getAllGoals();
  const achievements = getAllAchievements();
  let achievementsUnlocked = false;
  
  // Completar 5 metas financeiras
  const financialGoalsCompleted = goals.filter(g => g.category === 'financial' && g.completed).length;
  const financialMasterAchievement = achievements.find(a => a.id === 'financial_master');
  
  if (financialMasterAchievement && !financialMasterAchievement.isUnlocked && financialGoalsCompleted >= 5) {
    financialMasterAchievement.isUnlocked = true;
    financialMasterAchievement.dateUnlocked = new Date().toISOString();
    achievementsUnlocked = true;
    
    toast.success("🏆 Nova conquista desbloqueada!", {
      description: financialMasterAchievement.name
    });
  }
  
  // Completar 10 metas no total
  const totalGoalsCompleted = goals.filter(g => g.completed).length;
  const goalMasterAchievement = achievements.find(a => a.id === 'goal_master');
  
  if (goalMasterAchievement && !goalMasterAchievement.isUnlocked && totalGoalsCompleted >= 10) {
    goalMasterAchievement.isUnlocked = true;
    goalMasterAchievement.dateUnlocked = new Date().toISOString();
    achievementsUnlocked = true;
    
    toast.success("🏆 Nova conquista desbloqueada!", {
      description: goalMasterAchievement.name
    });
  }
  
  // Atualizar as conquistas se alguma foi desbloqueada
  if (achievementsUnlocked) {
    localStorage.setItem("achievements", JSON.stringify(achievements));
  }
  
  return achievements;
}

// Conquistas padrão do sistema
function getDefaultAchievements(): Achievement[] {
  return [
    {
      id: 'first_goal',
      name: 'Primeiro Passo',
      description: 'Complete sua primeira meta',
      icon: '🚀',
      category: 'operational',
      dateUnlocked: null,
      isUnlocked: false
    },
    {
      id: 'inventory_master',
      name: 'Mestre do Estoque',
      description: 'Complete 3 metas de estoque',
      icon: '📦',
      category: 'inventory',
      dateUnlocked: null,
      isUnlocked: false,
      requiredGoals: 3
    },
    {
      id: 'financial_master',
      name: 'Gênio Financeiro',
      description: 'Complete 5 metas financeiras',
      icon: '💰',
      category: 'financial',
      dateUnlocked: null,
      isUnlocked: false,
      requiredGoals: 5
    },
    {
      id: 'sales_expert',
      name: 'Expert em Vendas',
      description: 'Complete 5 metas de vendas',
      icon: '🏆',
      category: 'sales',
      dateUnlocked: null,
      isUnlocked: false,
      requiredGoals: 5
    },
    {
      id: 'goal_master',
      name: 'Mestre das Metas',
      description: 'Complete 10 metas no total',
      icon: '⭐',
      category: 'operational',
      dateUnlocked: null,
      isUnlocked: false,
      requiredGoals: 10
    }
  ];
}

// Adiciona algumas metas padrão para novos usuários
export function initializeDefaultGoals(): void {
  const goals = getAllGoals();
  
  // Só inicializa se não houver metas
  if (goals.length === 0) {
    const defaultGoals = [
      {
        title: "Reduzir CMV em 2%",
        description: "Diminuir o Custo da Mercadoria Vendida em 2% nos próximos 30 dias",
        target: 2,
        current: 0,
        unit: "%",
        category: "financial" as GoalCategory,
        reward: "Bônus de gestão"
      },
      {
        title: "Otimizar estoque mínimo",
        description: "Ajustar os níveis mínimos de estoque para 10 itens críticos",
        target: 10,
        current: 0,
        unit: "itens",
        category: "inventory" as GoalCategory,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: "Redução de desperdício",
        description: "Reduzir o desperdício de alimentos em 15%",
        target: 15,
        current: 3,
        unit: "%",
        category: "operational" as GoalCategory
      }
    ];
    
    defaultGoals.forEach(goal => addGoal(goal));
  }
  
  // Inicializa conquistas se não existirem
  if (!localStorage.getItem("achievements")) {
    localStorage.setItem("achievements", JSON.stringify(getDefaultAchievements()));
  }
}
