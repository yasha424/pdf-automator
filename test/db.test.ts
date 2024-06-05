import { DataBase } from '../src/server/db';

describe('DB', () => {
  it('adding new user', async () => {
    DataBase.shared.insert('users', ['email', 'firstName', 'lastName', 'password'], ['12345@gmail.com', '13245', '12345', 'Qwerty123!'], (err) => {
      expect(err).toEqual(null);
    });
  });

  it('create new pdf', async () => {
    DataBase.shared.insert('pdfTemplates', ['filename', 'pdfJson', 'userEmail'], ['123.pdf', '[]', '12345@gmail.com'], (err) => {
      expect(err).toEqual(null);
    });
  });

  it('get pdf', async () => {
    DataBase.shared.getAll('pdfTemplates', ['*'], ['userEmail'], ['12345@gmail.com'], (err, pdf) => {
      expect(err).toEqual(null);
    });
  });

  it('deleting pdf', async () => {
    DataBase.shared.delete('pdfTemplates', ['userEmail'], ['12345@gmail.com'], (err) => {
      expect(err).toEqual(null);
    })
  });

  it('make user admin', async () => {
    DataBase.shared.getAll('users', ['1'], undefined, undefined, (err, users) => {
      expect(users).not.toEqual(0);
    });
  });

  it('create new default pdf', async () => {
    DataBase.shared.insert('deafultPdfs', ['filename', 'pdfJson'], ['123.pdf', '[]'], (err) => {
      expect(err).toEqual(null);
    });
  });

  it('get default pdf', async () => {
    DataBase.shared.getAll('deafultPdfs', ['*'], undefined, undefined, (err, pdf) => {
      expect(err).toEqual(null);
    });
  });

  it('deleting user', async () => {
    DataBase.shared.delete('users', ['email'], ['12345@gmail.com'], (err) => {
      expect(err).toEqual(null);
    })
  });

  it('make user admin', async () => {
    DataBase.shared.update('users', ['admin'], ['email'], [true, '12345@gmail.com'], ['12345@gmail.com'], (err) => {
      expect(err).not.toEqual(null);
    });
  });

});
