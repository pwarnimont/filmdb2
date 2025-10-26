describe('FilmDB smoke test', () => {
  it('loads the login page', () => {
    cy.visit('/');
    cy.contains('Welcome back');
    cy.get('button').contains('Sign in').should('exist');
  });
});
