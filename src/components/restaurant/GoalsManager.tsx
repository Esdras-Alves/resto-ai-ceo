
import { useState, useEffect } from "react";
import { 
  Goal, 
  GoalCategory, 
  getAllGoals, 
  addGoal, 
  removeGoal,
  initializeDefaultGoals,
  syncGoalsWithFinancialData,
  setupFinancialDataListener
} from "@/services/GoalsService";
import { GoalProgressCard } from "./GoalProgressCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Trophy, Award, Target, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { AchievementsDisplay } from "./AchievementsDisplay";
import { Switch } from "@/components/ui/switch";

export function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [linkToFinancial, setLinkToFinancial] = useState(false);
  
  // Formulário para nova meta
  const [newGoal, setNewGoal] = useState<{
    title: string;
    description: string;
    target: number;
    current: number;
    unit: string;
    category: GoalCategory;
    deadline?: string;
    reward?: string;
    linkedTo?: {
      source: "dre" | "cmv" | "cashFlow";
      metric: string;
    };
  }>({
    title: "",
    description: "",
    target: 0,
    current: 0,
    unit: "",
    category: "operational"
  });
  
  // Carregar metas ao montar o componente
  useEffect(() => {
    loadGoals();
    
    // Inicializar metas padrão se necessário
    initializeDefaultGoals();
    
    // Configurar listener para dados financeiros
    setupFinancialDataListener();
    
    // Sincronizar metas com dados financeiros no carregamento
    syncGoalsWithFinancialData();
    
    // Listener para atualização de metas
    const handleGoalsUpdated = () => {
      loadGoals();
    };
    
    window.addEventListener("goalsUpdated", handleGoalsUpdated);
    
    return () => {
      window.removeEventListener("goalsUpdated", handleGoalsUpdated);
    };
  }, []);
  
  // Função para carregar metas
  const loadGoals = () => {
    const loadedGoals = getAllGoals();
    setGoals(loadedGoals);
  };
  
  // Adicionar nova meta
  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.unit) {
      toast.error("Preencha todos os campos obrigatórios", {
        description: "Título, meta e unidade são obrigatórios"
      });
      return;
    }
    
    try {
      addGoal(newGoal);
      
      // Resetar formulário
      setNewGoal({
        title: "",
        description: "",
        target: 0,
        current: 0,
        unit: "",
        category: "operational"
      });
      setLinkToFinancial(false);
      
      setIsAddDialogOpen(false);
      loadGoals();
      
    } catch (error) {
      console.error("Erro ao adicionar meta:", error);
      toast.error("Erro ao adicionar meta");
    }
  };
  
  // Excluir meta
  const handleDeleteGoal = (goalId: string) => {
    if (removeGoal(goalId)) {
      toast.success("Meta removida com sucesso");
      loadGoals();
    } else {
      toast.error("Erro ao remover meta");
    }
  };
  
  // Estatísticas gerais
  const completedGoals = goals.filter(g => g.completed).length;
  const totalProgress = goals.length > 0 
    ? Math.round((completedGoals / goals.length) * 100) 
    : 0;
  
  // Agrupar metas por categoria
  const goalsByCategory: Record<GoalCategory, Goal[]> = {
    financial: goals.filter(g => g.category === "financial"),
    inventory: goals.filter(g => g.category === "inventory"),
    sales: goals.filter(g => g.category === "sales"),
    operational: goals.filter(g => g.category === "operational"),
    customer: goals.filter(g => g.category === "customer")
  };
  
  // Tradução de categorias
  const categoryNames: Record<GoalCategory, string> = {
    financial: "Financeiro",
    inventory: "Estoque",
    sales: "Vendas",
    operational: "Operacional",
    customer: "Clientes"
  };
  
  // Atualizar linkedTo com base na categoria
  const handleCategoryChange = (category: GoalCategory) => {
    let updatedGoal = {...newGoal, category};
    
    // Se a categoria for financeira e a opção de vincular estiver ativada,
    // adicionar vinculação padrão com base na unidade
    if (category === "financial" && linkToFinancial) {
      if (newGoal.unit === "%") {
        updatedGoal.linkedTo = {
          source: "dre",
          metric: "profit_margin"
        };
      }
    } else if (category !== "financial") {
      // Se não for financeira, remover vinculação
      setLinkToFinancial(false);
      delete updatedGoal.linkedTo;
    }
    
    setNewGoal(updatedGoal);
  };
  
  // Alternar vinculação com dados financeiros
  const handleToggleLink = (checked: boolean) => {
    setLinkToFinancial(checked);
    
    if (checked && newGoal.category === "financial") {
      // Adicionar vinculação padrão com base na unidade
      const updatedGoal = {...newGoal};
      
      if (newGoal.unit === "%") {
        updatedGoal.linkedTo = {
          source: "dre",
          metric: "profit_margin"
        };
      } else {
        updatedGoal.linkedTo = {
          source: "cashFlow",
          metric: "revenue_growth"
        };
      }
      
      setNewGoal(updatedGoal);
    } else {
      // Remover vinculação
      const updatedGoal = {...newGoal};
      delete updatedGoal.linkedTo;
      setNewGoal(updatedGoal);
    }
  };
  
  // Alterar a fonte de dados para vinculação
  const handleLinkSourceChange = (source: "dre" | "cmv" | "cashFlow") => {
    if (!linkToFinancial) return;
    
    const metrics: Record<string, string> = {
      "dre": "profit_margin",
      "cmv": "reduction",
      "cashFlow": "revenue_growth"
    };
    
    setNewGoal({
      ...newGoal,
      linkedTo: {
        source,
        metric: metrics[source]
      }
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Sistema de Metas</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe seu progresso e conquiste recompensas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAchievements(true)}
            className="flex items-center"
          >
            <Trophy className="mr-2 h-4 w-4 text-amber-500" />
            Conquistas
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Meta</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título da Meta*</Label>
                  <Input 
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    placeholder="Ex: Reduzir CMV em 2%"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    placeholder="Descreva sua meta em detalhes"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="target">Valor Alvo*</Label>
                    <Input
                      id="target"
                      type="number"
                      value={newGoal.target || ""}
                      onChange={(e) => setNewGoal({...newGoal, target: Number(e.target.value)})}
                      min={0}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unidade*</Label>
                    <Input
                      id="unit"
                      value={newGoal.unit}
                      onChange={(e) => setNewGoal({...newGoal, unit: e.target.value})}
                      placeholder="%, unidades, R$, etc"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current">Progresso Atual</Label>
                    <Input
                      id="current"
                      type="number"
                      value={newGoal.current || ""}
                      onChange={(e) => setNewGoal({...newGoal, current: Number(e.target.value)})}
                      min={0}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select 
                      value={newGoal.category} 
                      onValueChange={(value: GoalCategory) => handleCategoryChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="financial">Financeiro</SelectItem>
                        <SelectItem value="inventory">Estoque</SelectItem>
                        <SelectItem value="sales">Vendas</SelectItem>
                        <SelectItem value="operational">Operacional</SelectItem>
                        <SelectItem value="customer">Clientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {newGoal.category === "financial" && (
                  <div className="border rounded-md p-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="link-financial">
                          <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-blue-600" />
                            Sincronizar com dados financeiros
                          </div>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Atualiza automaticamente o progresso com base em DRE, CMV ou Fluxo de Caixa
                        </p>
                      </div>
                      <Switch 
                        id="link-financial" 
                        checked={linkToFinancial} 
                        onCheckedChange={handleToggleLink}
                      />
                    </div>
                    
                    {linkToFinancial && (
                      <div className="mt-3 pt-3 border-t">
                        <Label htmlFor="link-source" className="mb-2 block text-sm">
                          Fonte de dados
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant={newGoal.linkedTo?.source === "dre" ? "default" : "outline"} 
                            onClick={() => handleLinkSourceChange("dre")}
                          >
                            DRE
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant={newGoal.linkedTo?.source === "cmv" ? "default" : "outline"} 
                            onClick={() => handleLinkSourceChange("cmv")}
                          >
                            CMV
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            variant={newGoal.linkedTo?.source === "cashFlow" ? "default" : "outline"} 
                            onClick={() => handleLinkSourceChange("cashFlow")}
                          >
                            Fluxo de Caixa
                          </Button>
                        </div>
                        
                        <p className="text-xs text-blue-600 mt-2">
                          {newGoal.linkedTo?.source === "dre" && "Vinculado à Margem de Lucro do DRE"}
                          {newGoal.linkedTo?.source === "cmv" && "Vinculado à Redução do CMV"}
                          {newGoal.linkedTo?.source === "cashFlow" && "Vinculado ao Crescimento de Receita"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Prazo Limite</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newGoal.deadline?.split('T')[0] || ""}
                    onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="reward">Recompensa</Label>
                  <Input
                    id="reward"
                    value={newGoal.reward || ""}
                    onChange={(e) => setNewGoal({...newGoal, reward: e.target.value})}
                    placeholder="Ex: Bônus de 10%, Dia livre, etc"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleAddGoal}>Adicionar Meta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Diálogo para exibir conquistas */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="sm:max-w-[725px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-amber-500" />
              Suas Conquistas
            </DialogTitle>
          </DialogHeader>
          <AchievementsDisplay />
        </DialogContent>
      </Dialog>
      
      {/* Progresso geral */}
      <div className="bg-white p-4 rounded-md border shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Progresso Geral</h3>
          <span className="text-sm text-muted-foreground">
            {completedGoals} de {goals.length} metas completadas
          </span>
        </div>
        <Progress value={totalProgress} className="h-2" />
        <div className="text-xs text-right mt-1 text-muted-foreground">{totalProgress}%</div>
      </div>
      
      {/* Abas para categorias */}
      <Tabs defaultValue="all">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
          <TabsTrigger value="financial" className="flex-1">Financeiro</TabsTrigger>
          <TabsTrigger value="inventory" className="flex-1">Estoque</TabsTrigger>
          <TabsTrigger value="operational" className="flex-1">Operacional</TabsTrigger>
          <TabsTrigger value="sales" className="flex-1">Vendas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <div className="space-y-4">
            {goals.length > 0 ? (
              goals.map(goal => (
                <GoalProgressCard
                  key={goal.id}
                  goal={goal}
                  onDelete={handleDeleteGoal}
                />
              ))
            ) : (
              <div className="text-center py-8 rounded-md border border-dashed">
                <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium">Nenhuma meta adicionada</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione metas para acompanhar seu progresso
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Meta
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Conteúdo para cada categoria */}
        {(Object.keys(goalsByCategory) as GoalCategory[]).map(category => (
          <TabsContent key={category} value={category}>
            <div className="space-y-4">
              {goalsByCategory[category].length > 0 ? (
                goalsByCategory[category].map(goal => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    onDelete={handleDeleteGoal}
                  />
                ))
              ) : (
                <div className="text-center py-8 rounded-md border border-dashed">
                  <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-lg font-medium">
                    Nenhuma meta de {categoryNames[category]} adicionada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adicione metas para esta categoria
                  </p>
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Meta
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
