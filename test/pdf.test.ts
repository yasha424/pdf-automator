import { PDF } from '../src/server/pdf';

describe('PDF', () => {
  it('Wrapping text', async () => {
    const pdf = new PDF();
    const wrappedString = pdf.wrapText('some not so long text', 180, await pdf.getFont(), 12);
    expect(wrappedString).toEqual('some not so long text ');
  });
});
