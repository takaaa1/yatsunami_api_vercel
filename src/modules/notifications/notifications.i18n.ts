export type SupportedLocale = 'pt-BR' | 'ja-JP';

const notificationStrings: Record<SupportedLocale, Record<string, { title: string; message: string }>> = {
    'pt-BR': {
        'notification.orderCreated': {
            title: '📦 Novo Pedido Recebido',
            message: 'O usuário {{userName}} realizou um novo pedido (#{{orderCode}}).',
        },
        'notification.receiptReceived': {
            title: '🧾 Novo Comprovante Recebido',
            message: 'O usuário {{userName}} enviou um comprovante para o pedido #{{orderCode}}.',
        },
        'notification.paymentConfirmed': {
            title: '✅ Pagamento Confirmado',
            message: 'Seu pagamento para o pedido #{{orderCode}} foi confirmado!',
        },
        'notification.receiptRejected': {
            title: '❌ Comprovante Recusado',
            message: 'O comprovante do pedido #{{orderCode}} não pôde ser validado. Por favor, envie um novo comprovante.',
        },
        'notification.orderCancelledByAdmin': {
            title: '🚫 Pedido Cancelado',
            message: 'Seu pedido #{{orderCode}} foi cancelado pelo administrador.',
        },
        'notification.orderCancelledByUser': {
            title: '🚫 Pedido Cancelado pelo Usuário',
            message: 'O usuário {{userName}} cancelou o pedido #{{orderCode}}.',
        },
        'notification.cancellationReverted': {
            title: '↩️ Cancelamento Revertido',
            message: 'O cancelamento do seu pedido #{{orderCode}} foi revertido.',
        },
        'notification.paymentReverted': {
            title: '↩️ Pagamento Revertido',
            message: 'O status do seu pedido #{{orderCode}} foi alterado. Por favor, verifique os detalhes.',
        },
        'notification.newOrderForm': {
            title: '📋 Nova Encomenda Disponível',
            message: 'Já pode fazer seu pedido para a entrega do dia {{data}}!',
        },
        'notification.orderFormClosed': {
            title: '✅ Encomenda Encerrada',
            message: 'O formulário de encomenda foi concluído. Obrigado pelo seu pedido!',
        },
        'notification.expressOrderCreated': {
            title: '🚀 Novo Pedido Expresso',
            message: 'O usuário {{userName}} realizou um novo pedido expresso (#{{orderCode}}).',
        },
        'notification.expressOrderConfirmed': {
            title: '✅ Pedido Expresso Confirmado',
            message: 'Seu pedido expresso #{{orderCode}} foi confirmado!',
        },
        'notification.expressOrderDelivered': {
            title: '🎉 Pedido Expresso Entregue',
            message: 'Seu pedido expresso #{{orderCode}} foi entregue. Bom apetite!',
        },
        'notification.expressOrderCancelled': {
            title: '🚫 Pedido Expresso Cancelado',
            message: 'O usuário cancelou o pedido expresso #{{orderCode}}.',
        },
    },
    'ja-JP': {
        'notification.orderCreated': {
            title: '📦 新規注文受信',
            message: '{{userName}}さんが新しい注文（#{{orderCode}}）を行いました。',
        },
        'notification.receiptReceived': {
            title: '🧾 領収書受信',
            message: '{{userName}}さんが注文 #{{orderCode}} の領収書を送信しました。',
        },
        'notification.paymentConfirmed': {
            title: '✅ 支払い確認済み',
            message: '注文 #{{orderCode}} の支払いが確認されました！',
        },
        'notification.receiptRejected': {
            title: '❌ 領収書却下',
            message: '注文 #{{orderCode}} の領収書は確認できませんでした。新しい領収書を送付してください。',
        },
        'notification.orderCancelledByAdmin': {
            title: '🚫 注文キャンセル',
            message: '注文 #{{orderCode}} は管理者によりキャンセルされました。',
        },
        'notification.orderCancelledByUser': {
            title: '🚫 ユーザーによるキャンセル',
            message: '{{userName}}さんが注文 #{{orderCode}} をキャンセルしました。',
        },
        'notification.cancellationReverted': {
            title: '↩️ キャンセル取消',
            message: '注文 #{{orderCode}} のキャンセルが取り消されました。',
        },
        'notification.paymentReverted': {
            title: '↩️ 支払いステータス変更',
            message: '注文 #{{orderCode}} のステータスが変更されました。詳細をご確認ください。',
        },
        'notification.newOrderForm': {
            title: '📋 新規注文フォーム',
            message: '{{data}}の配達に向けてご注文いただけます！',
        },
        'notification.orderFormClosed': {
            title: '✅ 注文終了',
            message: '注文フォームが終了しました。ご注文ありがとうございました！',
        },
        'notification.expressOrderCreated': {
            title: '🚀 新規エクスプレス注文',
            message: '{{userName}}さんが新しいエクスプレス注文（#{{orderCode}}）を行いました。',
        },
        'notification.expressOrderConfirmed': {
            title: '✅ エクスプレス注文確認済み',
            message: 'エクスプレス注文 #{{orderCode}} が確認されました！',
        },
        'notification.expressOrderDelivered': {
            title: '🎉 エクスプレス注文配達済み',
            message: 'エクスプレス注文 #{{orderCode}} が配達されました。召し上がれ！',
        },
        'notification.expressOrderCancelled': {
            title: '🚫 エクスプレス注文キャンセル',
            message: 'エクスプレス注文 #{{orderCode}} がキャンセルされました。',
        },
    },
};

export function buildNotificationMessage(
    key: string,
    params: Record<string, string>,
    locale: SupportedLocale,
): { title: string; message: string } {
    const localeStrings = notificationStrings[locale] ?? notificationStrings['pt-BR'];
    const template = localeStrings[key] ?? notificationStrings['pt-BR'][key];

    if (!template) {
        return { title: key, message: '' };
    }

    const interpolate = (str: string) =>
        str.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? '');

    return {
        title: interpolate(template.title),
        message: interpolate(template.message),
    };
}
