// Script para atualizar todos os agendamentos existentes
// Para usar, copie e cole este script no console do navegador
// enquanto estiver na página de agendamentos

(async function() {
  try {
    // Obter o tenant da URL
    const path = window.location.pathname;
    const tenant = path.split('/')[1];
    
    if (!tenant) {
      console.error('Não foi possível determinar o tenant da URL');
      return;
    }
    
    console.log(`Atualizando agendamentos para o tenant: ${tenant}`);
    
    // Fazer a requisição para atualizar todos os agendamentos
    const response = await fetch(`/api/${tenant}/appointments/update-all`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Falha ao atualizar agendamentos:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Resultado da atualização:', result);
    
    // Recarregar a página para mostrar os agendamentos atualizados
    if (result.updatedAppointments.length > 0) {
      console.log(`${result.updatedAppointments.length} agendamentos foram atualizados com sucesso!`);
      
      // Perguntar se o usuário deseja recarregar a página
      if (confirm(`${result.updatedAppointments.length} agendamentos foram atualizados com sucesso! Deseja recarregar a página para ver as alterações?`)) {
        window.location.reload();
      }
    } else {
      console.log('Nenhum agendamento precisava ser atualizado.');
    }
  } catch (error) {
    console.error('Erro ao executar o script:', error);
  }
})(); 