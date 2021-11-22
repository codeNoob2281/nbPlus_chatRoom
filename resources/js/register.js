//注册表单校验
function regValidation() {
    if ($('#username').val() === "") {
        alert('账号不能为空');
        return false;
    } else if ($('#password').val() !== $('#repeatPsw').val()) {
        alert('两次密码输入不一致');
        return false;
    } else if ($('#password').val() === '') {
        alert('密码不能为空');
        return false;
    }
    return true;

}