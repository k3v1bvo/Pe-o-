export type Locale = 'es' | 'en' | 'pt' | 'fr';

export const LOCALE_LABELS: Record<Locale, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
  fr: 'Français',
};

export interface Dictionary {
  app: {
    publicTitle: string;
    publicSubtitle: string;
    unlockTitle: string;
    unlockSubtitle: string;
    unlockTag: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    noData: string;
    confirmDelete: string;
    uploadPhoto: string;
    uploading: string;
    demoBanner: string;
  };
  calc: {
    history: string;
    clearHistory: string;
    emptyHistory: string;
    standard: string;
    error: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    backToCalc: string;
    signOut: string;
    invalidCredentials: string;
    roleAdmin: string;
    roleWarehouse: string;
    roleSeller: string;
    demoAdminBtn: string;
    demoWarehouseBtn: string;
  };
  nav: {
    dashboard: string;
    inventory: string;
    grading: string;
    sales: string;
    consignments: string;
    pricing: string;
    expenses: string;
    photos: string;
    users: string;
    settings: string;
    account: string;
    lockCalculator: string;
  };
  units: {
    kilo: string;
    half: string;
    quarter: string;
    eighth: string;
    grams: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    todaySales: string;
    totalRevenue: string;
    totalExpenses: string;
    netProfit: string;
    availableStock: string;
    totalShrinkage: string;
    salesChart: string;
    recentSales: string;
    lowStockAlerts: string;
    bagsAvailable: string;
    warehouseRestricted: string;
  };
  inventory: {
    title: string;
    subtitle: string;
    newLot: string;
    strain: string;
    supplier: string;
    declaredWeight: string;
    actualWeight: string;
    difference: string;
    shrinkage: string;
    status: string;
    photos: string;
    quickUnit: string;
    bagCountHint: string;
    notes: string;
    addPhoto: string;
    photoDesc: string;
    statusReceived: string;
    statusGrading: string;
    statusGraded: string;
    statusSoldOut: string;
  };
  grading: {
    title: string;
    subtitle: string;
    selectLot: string;
    bagType: string;
    bag50: string;
    bag30: string;
    bag100: string;
    bagCustom: string;
    weightPerBag: string;
    bagPrice: string;
    quantity: string;
    createBags: string;
    totalGraded: string;
    remainingShrinkage: string;
    availableBags: string;
    soldBags: string;
    priceHiddenWarehouse: string;
  };
  sales: {
    title: string;
    subtitle: string;
    newSale: string;
    saleType: string;
    retail: string;
    wholesale: string;
    warehouseWholesaleOnly: string;
    selectBag: string;
    bulkSale: string;
    selectLot: string;
    quantityG: string;
    unitPrice: string;
    totalPrice: string;
    registerSale: string;
    history: string;
    specials: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    strainsTitle: string;
    newStrain: string;
    strainName: string;
    pricePerGram: string;
    rulesTitle: string;
    newRule: string;
    ruleType: string;
    special: string;
    minQty: string;
    description: string;
  };
  expenses: {
    title: string;
    subtitle: string;
    newExpense: string;
    category: string;
    amount: string;
    description: string;
    receipt: string;
    totalExpenses: string;
    categories: {
      taxi: string;
      food: string;
      bags: string;
      supplies: string;
      trips: string;
      taxes: string;
      other: string;
    };
  };
  photos: {
    title: string;
    subtitle: string;
    allLots: string;
    noPhotos: string;
  };
  users: {
    title: string;
    subtitle: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    howToAdd: string;
  };
  settings: {
    title: string;
    subtitle: string;
    currency: string;
    language: string;
    saveSettings: string;
    savedSuccess: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  es: {
    app: {
      publicTitle: 'Calculadora',
      publicSubtitle: 'Estándar',
      unlockTitle: '420 · MODO MAESTRO ACTIVADO',
      unlockSubtitle: 'Acceso concedido al sistema de control',
      unlockTag: 'VERIFICADO',
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      add: 'Agregar',
      close: 'Cerrar',
      noData: 'Sin registros todavía',
      confirmDelete: '¿Seguro que deseas eliminar este registro?',
      uploadPhoto: 'Subir foto',
      uploading: 'Subiendo...',
      demoBanner: 'Modo local/demo activo (configura Supabase en .env.local para persistencia real)',
    },
    calc: {
      history: 'Historial',
      clearHistory: 'Limpiar',
      emptyHistory: 'Sin operaciones recientes',
      standard: 'Estándar',
      error: 'Error',
    },
    auth: {
      loginTitle: 'Acceso al Sistema',
      loginSubtitle: 'Ingresa con tus credenciales asignadas',
      email: 'Correo electrónico',
      password: 'Contraseña',
      signIn: 'Entrar',
      signingIn: 'Verificando...',
      backToCalc: 'Volver',
      signOut: 'Cerrar sesión',
      invalidCredentials: 'Credenciales inválidas',
      roleAdmin: 'Admin',
      roleWarehouse: 'Almacén',
      roleSeller: 'Ventas',
      demoAdminBtn: 'Probar como Admin (Demo)',
      demoWarehouseBtn: 'Probar como Almacenista (Demo)',
    },
    nav: {
      dashboard: 'Panel General',
      inventory: 'Almacén / Entradas',
      grading: 'Grameo y Bolsas',
      sales: 'Ventas',
      consignments: 'Concesiones / Fiado',
      pricing: 'Precios y Cepas',
      expenses: 'Gastos e Insumos',
      photos: 'Galería de Pesaje',
      users: 'Usuarios',
      settings: 'Configuración',
      account: 'Mi Cuenta / Clave',
      lockCalculator: 'Bloquear Sesión',
    },
    units: {
      kilo: 'Kilo (1,000g)',
      half: 'Medio (500g)',
      quarter: 'Cuarto (250g)',
      eighth: 'Medio Cuarto / Octavo (125g)',
      grams: 'gramos',
    },
    dashboard: {
      title: 'Panel de Control',
      subtitle: 'Resumen financiero, inventario y mermas',
      todaySales: 'Ventas de Hoy',
      totalRevenue: 'Ingresos Totales',
      totalExpenses: 'Gastos Totales',
      netProfit: 'Ganancia Neta',
      availableStock: 'Peso en Almacén',
      totalShrinkage: 'Merma Acumulada',
      salesChart: 'Actividad de Ventas y Gastos',
      recentSales: 'Últimas Ventas',
      lowStockAlerts: 'Resumen de Bolsas Disponibles',
      bagsAvailable: 'bolsas listas',
      warehouseRestricted: 'Vista restringida de Almacén: puedes registrar entradas, grameo, fotos y ventas mayoristas.',
    },
    inventory: {
      title: 'Almacén y Recepción',
      subtitle: 'Registra lotes entrantes, peso en báscula y fotos de respaldo',
      newLot: 'Registrar Entrada / Lote',
      strain: 'Variedad / Cepa',
      supplier: 'Proveedor / Origen',
      declaredWeight: 'Peso Declarado (g)',
      actualWeight: 'Peso Real Báscula (g)',
      difference: 'Diferencia al llegar',
      shrinkage: 'Merma / Secado',
      status: 'Estado',
      photos: 'Fotos de Pesaje',
      quickUnit: 'Atajo de unidad',
      bagCountHint: 'Ej: 4 bolsas de 1 kilo = 4000g',
      notes: 'Notas (humedad, estado de bolsas, etc.)',
      addPhoto: 'Agregar foto de báscula',
      photoDesc: 'Descripción (ej: Bolsa #1 en báscula)',
      statusReceived: 'Recibido',
      statusGrading: 'Grameando',
      statusGraded: 'Grameado',
      statusSoldOut: 'Agotado',
    },
    grading: {
      title: 'Grameo y Fraccionamiento',
      subtitle: 'Convierte lotes en bolsas de 50 (27g), 30 (15g), 100 (60g) o custom',
      selectLot: 'Seleccionar Lote',
      bagType: 'Tipo de Bolsa',
      bag50: 'Bolsa de 50 (~27g)',
      bag30: 'Bolsa de 30 (~15g)',
      bag100: 'Bolsa de 100 (~60g)',
      bagCustom: 'Personalizada',
      weightPerBag: 'Peso real por bolsa (g)',
      bagPrice: 'Precio de venta',
      quantity: 'Cantidad de bolsas',
      createBags: 'Crear Bolsas',
      totalGraded: 'Total Grameado',
      remainingShrinkage: 'Restante / Merma del lote',
      availableBags: 'Disponibles',
      soldBags: 'Vendidas',
      priceHiddenWarehouse: 'El precio lo configura únicamente el Admin',
    },
    sales: {
      title: 'Registro de Ventas',
      subtitle: 'Control de salidas al menudeo y mayoreo',
      newSale: 'Nueva Venta',
      saleType: 'Tipo de Venta',
      retail: 'Menudeo (Retail)',
      wholesale: 'Mayoreo (Wholesale)',
      warehouseWholesaleOnly: 'Tu rol de Almacenista solo registra ventas al por mayor.',
      selectBag: 'Vender Bolsa Grameada',
      bulkSale: 'Venta por Peso (Mayoreo / Granel)',
      selectLot: 'Lote de origen',
      quantityG: 'Cantidad (g)',
      unitPrice: 'Precio Unitario',
      totalPrice: 'Total Venta',
      registerSale: 'Confirmar Venta',
      history: 'Historial de Ventas',
      specials: 'Especiales / Combos',
    },
    pricing: {
      title: 'Precios, Cepas y Especiales',
      subtitle: 'Configura precio por gramo, menudeo, mayoreo y promociones',
      strainsTitle: 'Cepas / Productos',
      newStrain: 'Nueva Cepa',
      strainName: 'Nombre de la cepa',
      pricePerGram: 'Precio por gramo',
      rulesTitle: 'Reglas de Precio (Menudeo / Mayoreo / Especiales)',
      newRule: 'Nueva Regla de Precio',
      ruleType: 'Tipo',
      special: 'Especial / Promo',
      minQty: 'Cantidad mín. (g)',
      description: 'Descripción',
    },
    expenses: {
      title: 'Gastos e Insumos',
      subtitle: 'Taxis, comidas, bolsas, trips, suministros e impuestos',
      newExpense: 'Registrar Gasto',
      category: 'Categoría',
      amount: 'Monto',
      description: 'Detalle del gasto',
      receipt: 'Foto de recibo (opcional)',
      totalExpenses: 'Total en Gastos',
      categories: {
        taxi: 'Taxi / Transporte',
        food: 'Comidas',
        bags: 'Bolsas / Empaque',
        supplies: 'Insumos / Básculas',
        trips: 'Trips / Viajes',
        taxes: 'Impuestos / Licencias',
        other: 'Otros',
      },
    },
    photos: {
      title: 'Galería de Pesaje',
      subtitle: 'Evidencia fotográfica de báscula y control de secado',
      allLots: 'Todos los lotes',
      noPhotos: 'Aún no hay fotos registradas',
    },
    users: {
      title: 'Gestión de Usuarios',
      subtitle: 'Control de accesos Admin y Almacenista',
      name: 'Nombre',
      email: 'Correo',
      role: 'Rol',
      createdAt: 'Creado',
      howToAdd: 'Los nuevos usuarios se registran desde Supabase Auth y puedes cambiar su rol aquí.',
    },
    settings: {
      title: 'Configuración Global',
      subtitle: 'Moneda e idioma del sistema',
      currency: 'Moneda del Sistema',
      language: 'Idioma de la Interfaz',
      saveSettings: 'Guardar Configuración',
      savedSuccess: 'Configuración actualizada',
    },
  },
  en: {
    app: {
      publicTitle: 'Calculator',
      publicSubtitle: 'Standard',
      unlockTitle: '420 · MASTER MODE UNLOCKED',
      unlockSubtitle: 'Control system access granted',
      unlockTag: 'VERIFIED',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      close: 'Close',
      noData: 'No records yet',
      confirmDelete: 'Are you sure you want to delete this record?',
      uploadPhoto: 'Upload photo',
      uploading: 'Uploading...',
      demoBanner: 'Local/Demo mode active (configure Supabase in .env.local for live persistence)',
    },
    calc: {
      history: 'History',
      clearHistory: 'Clear',
      emptyHistory: 'No recent calculations',
      standard: 'Standard',
      error: 'Error',
    },
    auth: {
      loginTitle: 'System Sign In',
      loginSubtitle: 'Sign in with your assigned credentials',
      email: 'Email address',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Verifying...',
      backToCalc: 'Back to Calculator',
      signOut: 'Sign Out',
      invalidCredentials: 'Invalid credentials',
      roleAdmin: 'Admin',
      roleWarehouse: 'Warehouse',
      roleSeller: 'Sales',
      demoAdminBtn: 'Try as Admin (Demo)',
      demoWarehouseBtn: 'Try as Warehouse (Demo)',
    },
    nav: {
      dashboard: 'Dashboard',
      inventory: 'Warehouse / Intake',
      grading: 'Grading & Bags',
      sales: 'Sales',
      consignments: 'Consignments',
      pricing: 'Pricing & Strains',
      expenses: 'Expenses & Supplies',
      photos: 'Scale Photos',
      users: 'Users',
      settings: 'Settings',
      account: 'My Account / Password',
      lockCalculator: 'Calculator Mode',
    },
    units: {
      kilo: 'Kilo (1,000g)',
      half: 'Half (500g)',
      quarter: 'Quarter (250g)',
      eighth: 'Half-Quarter / Eighth (125g)',
      grams: 'grams',
    },
    dashboard: {
      title: 'Control Dashboard',
      subtitle: 'Financial overview, inventory & shrinkage',
      todaySales: "Today's Sales",
      totalRevenue: 'Total Revenue',
      totalExpenses: 'Total Expenses',
      netProfit: 'Net Profit',
      availableStock: 'Warehouse Weight',
      totalShrinkage: 'Total Shrinkage',
      salesChart: 'Sales & Expenses Overview',
      recentSales: 'Recent Sales',
      lowStockAlerts: 'Available Bags Summary',
      bagsAvailable: 'bags ready',
      warehouseRestricted: 'Warehouse view: you can log intake, grading, scale photos & wholesale sales.',
    },
    inventory: {
      title: 'Warehouse & Intake',
      subtitle: 'Log incoming batches, scale weights and verification photos',
      newLot: 'Register Intake / Lot',
      strain: 'Strain / Product',
      supplier: 'Supplier / Source',
      declaredWeight: 'Declared Weight (g)',
      actualWeight: 'Actual Scale Weight (g)',
      difference: 'Intake Difference',
      shrinkage: 'Shrinkage / Loss',
      status: 'Status',
      photos: 'Scale Photos',
      quickUnit: 'Unit shortcut',
      bagCountHint: 'Ex: 4 bags of 1 kilo = 4000g',
      notes: 'Notes (moisture, bag condition, etc.)',
      addPhoto: 'Add scale photo',
      photoDesc: 'Description (e.g., Bag #1 on scale)',
      statusReceived: 'Received',
      statusGrading: 'Grading',
      statusGraded: 'Graded',
      statusSoldOut: 'Sold Out',
    },
    grading: {
      title: 'Grading & Bagging',
      subtitle: 'Split batches into 50 (27g), 30 (15g), 100 (60g) or custom bags',
      selectLot: 'Select Lot',
      bagType: 'Bag Type',
      bag50: '50 Bag (~27g)',
      bag30: '30 Bag (~15g)',
      bag100: '100 Bag (~60g)',
      bagCustom: 'Custom',
      weightPerBag: 'Actual weight per bag (g)',
      bagPrice: 'Selling price',
      quantity: 'Number of bags',
      createBags: 'Create Bags',
      totalGraded: 'Total Graded',
      remainingShrinkage: 'Remaining / Lot Shrinkage',
      availableBags: 'Available',
      soldBags: 'Sold',
      priceHiddenWarehouse: 'Pricing is configured by Admin only',
    },
    sales: {
      title: 'Sales POS',
      subtitle: 'Retail and wholesale dispatch control',
      newSale: 'New Sale',
      saleType: 'Sale Type',
      retail: 'Retail',
      wholesale: 'Wholesale',
      warehouseWholesaleOnly: 'Warehouse role can only record wholesale sales.',
      selectBag: 'Sell Graded Bag',
      bulkSale: 'Bulk Weight Sale (Wholesale)',
      selectLot: 'Source Lot',
      quantityG: 'Quantity (g)',
      unitPrice: 'Unit Price',
      totalPrice: 'Total Sale',
      registerSale: 'Confirm Sale',
      history: 'Sales History',
      specials: 'Specials / Combos',
    },
    pricing: {
      title: 'Pricing, Strains & Specials',
      subtitle: 'Configure price per gram, retail, wholesale & special deals',
      strainsTitle: 'Strains / Products',
      newStrain: 'New Strain',
      strainName: 'Strain name',
      pricePerGram: 'Price per gram',
      rulesTitle: 'Pricing Rules (Retail / Wholesale / Specials)',
      newRule: 'New Pricing Rule',
      ruleType: 'Type',
      special: 'Special / Promo',
      minQty: 'Min qty (g)',
      description: 'Description',
    },
    expenses: {
      title: 'Expenses & Supplies',
      subtitle: 'Taxis, food, bags, trips, supplies & taxes',
      newExpense: 'Add Expense',
      category: 'Category',
      amount: 'Amount',
      description: 'Expense details',
      receipt: 'Receipt photo (optional)',
      totalExpenses: 'Total Expenses',
      categories: {
        taxi: 'Taxi / Transport',
        food: 'Food / Meals',
        bags: 'Bags / Packaging',
        supplies: 'Supplies / Scales',
        trips: 'Trips / Travel',
        taxes: 'Taxes / Permits',
        other: 'Other',
      },
    },
    photos: {
      title: 'Scale Photo Gallery',
      subtitle: 'Visual scale records and drying weight evidence',
      allLots: 'All lots',
      noPhotos: 'No photos uploaded yet',
    },
    users: {
      title: 'User Management',
      subtitle: 'Admin and Warehouse access control',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      createdAt: 'Created',
      howToAdd: 'Create new users in Supabase Auth and adjust their roles here.',
    },
    settings: {
      title: 'Global Settings',
      subtitle: 'System currency and interface language',
      currency: 'System Currency',
      language: 'Interface Language',
      saveSettings: 'Save Settings',
      savedSuccess: 'Settings saved',
    },
  },
  pt: {
    app: {
      publicTitle: 'Calculadora',
      publicSubtitle: 'Padrão',
      unlockTitle: '420 · MODO MESTRE ATIVADO',
      unlockSubtitle: 'Acesso ao sistema liberado',
      unlockTag: 'VERIFICADO',
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      add: 'Adicionar',
      close: 'Fechar',
      noData: 'Nenhum registro ainda',
      confirmDelete: 'Tem certeza que deseja excluir este registro?',
      uploadPhoto: 'Enviar foto',
      uploading: 'Enviando...',
      demoBanner: 'Modo local/demo ativo (configure o Supabase em .env.local)',
    },
    calc: {
      history: 'Histórico',
      clearHistory: 'Limpar',
      emptyHistory: 'Sem cálculos recentes',
      standard: 'Padrão',
      error: 'Erro',
    },
    auth: {
      loginTitle: 'Acesso ao Sistema',
      loginSubtitle: 'Entre com suas credenciais',
      email: 'E-mail',
      password: 'Senha',
      signIn: 'Entrar',
      signingIn: 'Verificando...',
      backToCalc: 'Voltar',
      signOut: 'Sair',
      invalidCredentials: 'Credenciais inválidas',
      roleAdmin: 'Admin',
      roleWarehouse: 'Estoque',
      roleSeller: 'Vendas',
      demoAdminBtn: 'Testar como Admin (Demo)',
      demoWarehouseBtn: 'Testar como Estoque (Demo)',
    },
    nav: {
      dashboard: 'Painel Geral',
      inventory: 'Estoque / Entradas',
      grading: 'Pesagem e Bolsas',
      sales: 'Vendas',
      consignments: 'Consignações',
      pricing: 'Preços e Variedades',
      expenses: 'Despesas e Insumos',
      photos: 'Fotos da Balança',
      users: 'Usuários',
      settings: 'Configurações',
      account: 'Minha Conta / Senha',
      lockCalculator: 'Bloquear Sesión',
    },
    units: {
      kilo: 'Quilo (1.000g)',
      half: 'Meio (500g)',
      quarter: 'Quarto (250g)',
      eighth: 'Oitavo (125g)',
      grams: 'gramas',
    },
    dashboard: {
      title: 'Painel de Controle',
      subtitle: 'Resumo financeiro, estoque e quebras',
      todaySales: 'Vendas de Hoje',
      totalRevenue: 'Receita Total',
      totalExpenses: 'Despesas Totais',
      netProfit: 'Lucro Líquido',
      availableStock: 'Peso em Estoque',
      totalShrinkage: 'Quebra Acumulada',
      salesChart: 'Vendas e Despesas',
      recentSales: 'Últimas Vendas',
      lowStockAlerts: 'Bolsas Disponíveis',
      bagsAvailable: 'bolsas prontas',
      warehouseRestricted: 'Visão de Estoque: registre entradas, pesagem, fotos e vendas no atacado.',
    },
    inventory: {
      title: 'Estoque e Recebimento',
      subtitle: 'Registre lotes, peso na balança e fotos',
      newLot: 'Registrar Entrada',
      strain: 'Variedade',
      supplier: 'Fornecedor',
      declaredWeight: 'Peso Declarado (g)',
      actualWeight: 'Peso Real Balança (g)',
      difference: 'Diferença',
      shrinkage: 'Quebra / Secagem',
      status: 'Status',
      photos: 'Fotos da Balança',
      quickUnit: 'Atalho de unidade',
      bagCountHint: 'Ex: 4 bolsas de 1kg = 4000g',
      notes: 'Notas',
      addPhoto: 'Adicionar foto da balança',
      photoDesc: 'Descrição da foto',
      statusReceived: 'Recebido',
      statusGrading: 'Pesando',
      statusGraded: 'Fracionado',
      statusSoldOut: 'Esgotado',
    },
    grading: {
      title: 'Fracionamento',
      subtitle: 'Divida lotes em bolsas de 50, 30, 100 ou personalizado',
      selectLot: 'Selecionar Lote',
      bagType: 'Tipo de Bolsa',
      bag50: 'Bolsa de 50 (~27g)',
      bag30: 'Bolsa de 30 (~15g)',
      bag100: 'Bolsa de 100 (~60g)',
      bagCustom: 'Personalizada',
      weightPerBag: 'Peso por bolsa (g)',
      bagPrice: 'Preço de venda',
      quantity: 'Quantidade de bolsas',
      createBags: 'Criar Bolsas',
      totalGraded: 'Total Fracionado',
      remainingShrinkage: 'Restante / Quebra',
      availableBags: 'Disponíveis',
      soldBags: 'Vendidas',
      priceHiddenWarehouse: 'Preço definido apenas pelo Admin',
    },
    sales: {
      title: 'Registro de Vendas',
      subtitle: 'Controle de varejo e atacado',
      newSale: 'Nova Venda',
      saleType: 'Tipo de Venda',
      retail: 'Varejo',
      wholesale: 'Atacado',
      warehouseWholesaleOnly: 'Estoque só registra vendas no atacado.',
      selectBag: 'Vender Bolsa',
      bulkSale: 'Venda por Peso (Atacado)',
      selectLot: 'Lote',
      quantityG: 'Quantidade (g)',
      unitPrice: 'Preço Unitário',
      totalPrice: 'Total',
      registerSale: 'Confirmar Venda',
      history: 'Histórico de Vendas',
      specials: 'Especiais',
    },
    pricing: {
      title: 'Preços e Variedades',
      subtitle: 'Configure preço por grama, varejo, atacado e promos',
      strainsTitle: 'Variedades',
      newStrain: 'Nova Variedade',
      strainName: 'Nome',
      pricePerGram: 'Preço por grama',
      rulesTitle: 'Regras de Preço',
      newRule: 'Nova Regra',
      ruleType: 'Tipo',
      special: 'Especial',
      minQty: 'Qtd mín. (g)',
      description: 'Descrição',
    },
    expenses: {
      title: 'Despesas e Insumos',
      subtitle: 'Táxis, alimentação, bolsas, viagens e impostos',
      newExpense: 'Registrar Despesa',
      category: 'Categoria',
      amount: 'Valor',
      description: 'Descrição',
      receipt: 'Foto do recibo (opcional)',
      totalExpenses: 'Total de Despesas',
      categories: {
        taxi: 'Táxi / Transporte',
        food: 'Alimentação',
        bags: 'Bolsas / Embalagem',
        supplies: 'Insumos',
        trips: 'Viagens',
        taxes: 'Impostos',
        other: 'Outros',
      },
    },
    photos: {
      title: 'Galeria da Balança',
      subtitle: 'Registro fotográfico de pesagem',
      allLots: 'Todos os lotes',
      noPhotos: 'Nenhuma foto enviada',
    },
    users: {
      title: 'Usuários',
      subtitle: 'Controle de acessos',
      name: 'Nome',
      email: 'E-mail',
      role: 'Função',
      createdAt: 'Criado em',
      howToAdd: 'Crie usuários no Supabase Auth e gerencie as funções aqui.',
    },
    settings: {
      title: 'Configurações',
      subtitle: 'Moeda e idioma',
      currency: 'Moeda do Sistema',
      language: 'Idioma',
      saveSettings: 'Salvar Configurações',
      savedSuccess: 'Configurações salvas',
    },
  },
  fr: {
    app: {
      publicTitle: 'Calculatrice',
      publicSubtitle: 'Standard',
      unlockTitle: '420 · MODE MAÎTRE ACTIVÉ',
      unlockSubtitle: 'Accès au système accordé',
      unlockTag: 'VÉRIFIÉ',
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      close: 'Fermer',
      noData: 'Aucune donnée',
      confirmDelete: 'Voulez-vous vraiment supprimer ?',
      uploadPhoto: 'Envoyer photo',
      uploading: 'Envoi...',
      demoBanner: 'Mode démo local (configurez Supabase dans .env.local)',
    },
    calc: {
      history: 'Historique',
      clearHistory: 'Effacer',
      emptyHistory: 'Aucun calcul récent',
      standard: 'Standard',
      error: 'Erreur',
    },
    auth: {
      loginTitle: 'Connexion',
      loginSubtitle: 'Entrez vos identifiants',
      email: 'E-mail',
      password: 'Mot de passe',
      signIn: 'Se connecter',
      signingIn: 'Vérification...',
      backToCalc: 'Retour à la Calculatrice',
      signOut: 'Déconnexion',
      invalidCredentials: 'Identifiants invalides',
      roleAdmin: 'Admin',
      roleWarehouse: 'Entrepôt',
      roleSeller: 'Ventes',
      demoAdminBtn: 'Tester Admin (Démo)',
      demoWarehouseBtn: 'Tester Magasinier (Démo)',
    },
    nav: {
      dashboard: 'Tableau de bord',
      inventory: 'Entrepôt / Entrées',
      grading: 'Pesage & Sachets',
      sales: 'Ventes',
      consignments: 'Consignations',
      pricing: 'Prix & Variétés',
      expenses: 'Dépenses',
      photos: 'Photos Balance',
      users: 'Utilisateurs',
      settings: 'Paramètres',
      account: 'Mon Compte / Mot de passe',
      lockCalculator: 'Mode Calculatrice',
    },
    units: {
      kilo: 'Kilo (1 000g)',
      half: 'Demi (500g)',
      quarter: 'Quart (250g)',
      eighth: 'Huitième (125g)',
      grams: 'grammes',
    },
    dashboard: {
      title: 'Tableau de Bord',
      subtitle: 'Aperçu financier, stock et pertes',
      todaySales: "Ventes d'aujourd'hui",
      totalRevenue: 'Revenu Total',
      totalExpenses: 'Dépenses Totales',
      netProfit: 'Bénéfice Net',
      availableStock: 'Stock en Entrepôt',
      totalShrinkage: 'Perte Totale',
      salesChart: 'Ventes & Dépenses',
      recentSales: 'Ventes Récentes',
      lowStockAlerts: 'Sachets Disponibles',
      bagsAvailable: 'sachets prêts',
      warehouseRestricted: 'Vue Magasinier : entrées, pesage, photos et ventes en gros.',
    },
    inventory: {
      title: 'Entrepôt & Réception',
      subtitle: 'Lots entrants, pesée et photos',
      newLot: 'Nouveau Lot',
      strain: 'Variété',
      supplier: 'Fournisseur',
      declaredWeight: 'Poids Déclaré (g)',
      actualWeight: 'Poids Réel (g)',
      difference: 'Écart',
      shrinkage: 'Perte / Séchage',
      status: 'Statut',
      photos: 'Photos Balance',
      quickUnit: 'Raccourci unité',
      bagCountHint: 'Ex: 4 sacs de 1kg = 4000g',
      notes: 'Notes',
      addPhoto: 'Ajouter photo balance',
      photoDesc: 'Description',
      statusReceived: 'Reçu',
      statusGrading: 'En pesage',
      statusGraded: 'Pesé',
      statusSoldOut: 'Épuisé',
    },
    grading: {
      title: 'Pesage & Sachets',
      subtitle: 'Diviser en sachets 50, 30, 100 ou personnalisé',
      selectLot: 'Choisir le Lot',
      bagType: 'Type de Sachet',
      bag50: 'Sachet 50 (~27g)',
      bag30: 'Sachet 30 (~15g)',
      bag100: 'Sachet 100 (~60g)',
      bagCustom: 'Personnalisé',
      weightPerBag: 'Poids par sachet (g)',
      bagPrice: 'Prix de vente',
      quantity: 'Nombre de sachets',
      createBags: 'Créer Sachets',
      totalGraded: 'Total Pesé',
      remainingShrinkage: 'Reste / Perte',
      availableBags: 'Disponibles',
      soldBags: 'Vendus',
      priceHiddenWarehouse: "Prix géré par l'Admin uniquement",
    },
    sales: {
      title: 'Ventes',
      subtitle: 'Détail et gros',
      newSale: 'Nouvelle Vente',
      saleType: 'Type de Vente',
      retail: 'Détail',
      wholesale: 'Gros',
      warehouseWholesaleOnly: 'Le magasinier enregistre uniquement les ventes en gros.',
      selectBag: 'Vendre Sachet',
      bulkSale: 'Vente au Poids (Gros)',
      selectLot: 'Lot source',
      quantityG: 'Quantité (g)',
      unitPrice: 'Prix Unitaire',
      totalPrice: 'Total',
      registerSale: 'Confirmer',
      history: 'Historique',
      specials: 'Promos',
    },
    pricing: {
      title: 'Prix & Variétés',
      subtitle: 'Prix au gramme, détail, gros et promos',
      strainsTitle: 'Variétés',
      newStrain: 'Nouvelle Variété',
      strainName: 'Nom',
      pricePerGram: 'Prix au gramme',
      rulesTitle: 'Règles de Prix',
      newRule: 'Nouvelle Règle',
      ruleType: 'Type',
      special: 'Spécial',
      minQty: 'Qté min (g)',
      description: 'Description',
    },
    expenses: {
      title: 'Dépenses',
      subtitle: 'Taxis, repas, sachets, trajets et taxes',
      newExpense: 'Ajouter Dépense',
      category: 'Catégorie',
      amount: 'Montant',
      description: 'Détails',
      receipt: 'Photo reçu (optionnel)',
      totalExpenses: 'Total Dépenses',
      categories: {
        taxi: 'Taxi / Transport',
        food: 'Repas',
        bags: 'Sachets / Emballage',
        supplies: 'Fournitures',
        trips: 'Trajets',
        taxes: 'Taxes',
        other: 'Autres',
      },
    },
    photos: {
      title: 'Galerie Balance',
      subtitle: 'Preuves photo de pesage',
      allLots: 'Tous les lots',
      noPhotos: 'Aucune photo',
    },
    users: {
      title: 'Utilisateurs',
      subtitle: 'Gestion des rôles',
      name: 'Nom',
      email: 'E-mail',
      role: 'Rôle',
      createdAt: 'Créé le',
      howToAdd: 'Ajoutez des utilisateurs dans Supabase Auth puis gérez leur rôle ici.',
    },
    settings: {
      title: 'Paramètres',
      subtitle: 'Devise et langue',
      currency: 'Devise',
      language: 'Langue',
      saveSettings: 'Enregistrer',
      savedSuccess: 'Paramètres enregistrés',
    },
  },
};

