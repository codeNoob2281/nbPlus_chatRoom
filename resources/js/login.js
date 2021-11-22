//登录表单校验
function formValidation() {
    if ($('#username').val() === '') {
        alert('账号不能为空');
        return false;
    } else if ($('#password').val() === '') {
        alert('密码不能为空');
        return false;
    }
    return true;
}



