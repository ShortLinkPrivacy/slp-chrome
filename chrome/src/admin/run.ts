module Admin {
    $(() => {
        var el = app.element = $('article');
        rivets.bind(el, app);
        app.loadArticle('privateKeyView');
    })
}
