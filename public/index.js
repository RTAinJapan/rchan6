const discordToken = localStorage.getItem('discordToken');
const discordExpire = localStorage.getItem('discordExpire');

// 「Discordでログイン」ボタン
$('#login').on('click', () => {
  fetch(`/getLoginUrl`, { method: 'get', headers: { accept: 'application/json' } })
    .then((res) => res.json())
    .then((res) => {
      const redirect = encodeURIComponent(`${location.origin}${location.pathname}login/discord/index.html`);
      const url = res.url + `&redirect_uri=${redirect}`;
      window.location.replace(url);
    })
    .catch((err) => {
      alert('おしめぇだ');
      console.log(err);
    })
    .finally(() => {
      //
    });
});

// サーバー参加者の情報取得
$('#create_sample').on('click', () => {
  createSample(false, false);
});

// サーバー参加者の情報取得
$('#create_sample_all').on('click', () => {
  createSample(true, false);
});

$('#send_message').on('click', () => {
  const isConfirmed = confirm('DMを送信しますか？');
  if (!isConfirmed) return;
  createSample(false, true);
});

const createSample = (isAll, isSend) => {
  toggleDisable(true);
  $('#results').text('');
  try {
    const message = $('#discord_text').val();
    const files = $('#sendtofile')[0].files;

    if (!message) {
      alert('本文テンプレートを入力してください');
      throw new Error('本文未記入');
    }

    if (files.length === 0) {
      alert('ファイルを添付してください');
      throw new Error('ファイル未選択');
    }
    const file = $('#sendtofile')[0].files[0];
    const fileRdr = new FileReader();
    fileRdr.onload = () => {
      // console.log(fileRdr.result.toString());

      let sendToList = fileRdr.result.toString();

      const data = {
        message,
        sendToList,
      };

      if (isSend) {
        fetch(`/sendDM`, { method: 'post', headers: { Authorization: `Bearer ${discordToken}`, 'content-type': 'application/json' }, body: JSON.stringify(data) })
          .then((res) => res.json())
          .then((res) => {
            console.log(res);
            $('#results').html(JSON.stringify(res));
          })
          .catch((reason) => {
            if (reason.status === 401) {
              alert('トークンが無効です');
              window.location.reload();
            }
          })
          .finally(() => {
            toggleDisable(false);
          });
      } else {
        fetch(`/createSample?isall=${isAll}`, { method: 'post', headers: { Authorization: `Bearer ${discordToken}`, 'content-type': 'application/json' }, body: JSON.stringify(data) })
          .then((res) => res.json())
          .then((res) => {
            console.log(res);
            let str = '';
            for (const item of res.data) {
              const { message, qr, discordtag } = item;
              str += `<div><div style="font-weight:bold;">${discordtag}</div><textarea rows=10 readonly>${message}</textarea><div><img src="${qr}" /></div></div><hr/>`;
            }
            $('#results').html(str);
          })
          .catch((reason) => {
            if (reason.status === 401) {
              alert('トークンが無効です');
              window.location.reload();
            }
          })
          .finally(() => {
            toggleDisable(false);
          });
      }
    };
    fileRdr.readAsText(file);
  } catch (e) {
    console.error(e.message);
    toggleDisable(false);
  }
};

/**
 * Disable切り替え
 * @param disabled {boolean}
 */
const toggleDisable = (disabled) => {
  $('input').attr('disabled', disabled);
  // $('#modify_user_role_userIds').attr('disabled', disabled);
};

//---------------------------------------------------------------
// ログインチェック
if (!discordToken) {
  $('#login').prop('disabled', false);
} else {
  if (new Date().getTime() < Number(discordExpire)) {
    fetch(`/checkUser`, { method: 'post', headers: { Authorization: `Bearer ${discordToken}`, 'content-type': 'application/json' } })
      .then((res) => res.json())
      .then((res) => {
        const userInfo = res.data;
        if (userInfo.status === 'ok') {
          $('#auth').hide();
          $('#content').show();
          $('#userinfo').append(`ようこそ ${userInfo.message}`);
        } else {
          alert('お前は誰だ');
          localStorage.removeItem('discordToken');
          localStorage.removeItem('discordExpire');
          localStorage.removeItem('discordState');
        }
      })
      .finally(() => {
        $('#login').prop('disabled', false);
      });
  } else {
    // 期限切れ
    console.log('期限切れだよ');
    $('#login').prop('disabled', false);
    localStorage.removeItem('discordToken');
    localStorage.removeItem('discordExpire');
    localStorage.removeItem('discordState');
  }
}
