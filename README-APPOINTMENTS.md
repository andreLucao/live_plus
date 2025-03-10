# Sistema de Agendamentos e Videochamadas

Este documento contém instruções sobre como usar o sistema de agendamentos e videochamadas do Live Plus.

## Funcionalidades

- Criação, edição e exclusão de agendamentos
- Geração automática de links para videochamadas usando o Jitsi Meet
- Filtros por status, data e profissional
- Visualização em lista ou calendário

## Como Usar

### Criação de Agendamentos

1. Clique no botão "Novo Agendamento"
2. Preencha os campos obrigatórios (paciente, profissional, serviço e data)
3. Selecione o status inicial (Pendente, Confirmado ou Cancelado)
4. Clique em "Salvar"

Ao criar um agendamento, um link único para videochamada é gerado automaticamente, independentemente do status do agendamento.

### Iniciar Videochamada

1. Clique no botão "Videochamada" ao lado do agendamento
2. No modal de confirmação, verifique os detalhes do agendamento
3. Clique em "Iniciar Videochamada"
4. Uma nova aba será aberta com a sala de reunião do Jitsi Meet

### Atualizar Links de Videochamada

Se você tiver agendamentos antigos que não possuem links de videochamada, você pode:

1. Clicar no botão "Gerar Links" na página de agendamentos
2. Ou executar o script `update-appointments.js` no console do navegador

## Solução de Problemas

### Agendamentos sem Link de Videochamada

Se você encontrar agendamentos que não possuem link de videochamada, você pode:

1. Atualizar o status do agendamento para "Confirmado" e depois de volta para o status original
2. Clicar no botão "Gerar Links" na página de agendamentos
3. Executar o script `update-appointments.js` no console do navegador

### Erro ao Iniciar Videochamada

Se você receber um erro ao tentar iniciar uma videochamada:

1. Verifique se o agendamento possui um link de videochamada no banco de dados
2. Tente atualizar o status do agendamento
3. Verifique se o navegador está permitindo abrir novas abas
4. Verifique o console do navegador para mensagens de erro detalhadas

## Estrutura de Dados

Cada agendamento possui os seguintes campos:

```javascript
{
  _id: "ID único do MongoDB",
  tenantPath: "Caminho do tenant",
  status: "Pending | Confirmed | Canceled",
  date: "Data e hora do agendamento",
  professional: "Nome do profissional",
  patient: "Nome do paciente",
  service: "Tipo de serviço",
  meetingId: "ID único da reunião",
  meetingUrl: "URL da sala de reunião do Jitsi",
  createdAt: "Data de criação",
  updatedAt: "Data de atualização"
}
```

## Notas Técnicas

- Os links de videochamada são gerados usando o formato `https://meet.jit.si/{tenantPath}-{meetingId}`
- O `meetingId` é um UUID v4 gerado automaticamente
- Os links de videochamada são gerados independentemente do status do agendamento
- Os links de videochamada são permanentes e não mudam quando o status do agendamento é alterado 